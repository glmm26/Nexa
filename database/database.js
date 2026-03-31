const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const DATABASE_PATH = path.join(__dirname, "store.db");
const USER_ROLE_CLIENT = "cliente";
const USER_ROLE_ADMIN = "admin";

let databasePromise;

const seedProducts = [
  {
    nome: "Aurora Oversized Tee",
    descricao:
      "Camiseta oversized em algodao premium com caimento estruturado e toque macio para uso diario.",
    preco: 129.9,
    imagem_url:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
    categoria: "camisetas",
    estoque: 18,
    tamanhos_disponiveis: ["P", "M", "G", "GG"],
    cores_disponiveis: ["preto", "branco", "azul"],
  },
  {
    nome: "Flux Denim Wide Leg",
    descricao:
      "Calca jeans wide leg com lavagem urbana, cintura alta e acabamento pensado para compor looks modernos.",
    preco: 249.9,
    imagem_url:
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=80",
    categoria: "calcas",
    estoque: 10,
    tamanhos_disponiveis: ["36", "38", "40", "42", "44"],
    cores_disponiveis: ["azul", "preto", "cinza"],
  },
  {
    nome: "Pulse Street Runner",
    descricao:
      "Tenis casual com cabedal respiravel, solado leve e identidade esportiva para acompanhar a rotina.",
    preco: 319.9,
    imagem_url:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
    categoria: "tenis",
    estoque: 7,
    tamanhos_disponiveis: ["38", "39", "40", "41", "42"],
    cores_disponiveis: ["preto", "branco", "vermelho"],
  },
  {
    nome: "Vanta Utility Jacket",
    descricao:
      "Jaqueta utilitaria com bolsos amplos, recortes marcantes e visual minimalista inspirado no streetwear.",
    preco: 389.9,
    imagem_url:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80",
    categoria: "jaquetas",
    estoque: 6,
    tamanhos_disponiveis: ["P", "M", "G", "GG"],
    cores_disponiveis: ["preto", "caqui", "grafite"],
  },
  {
    nome: "Slate Knit Polo",
    descricao:
      "Polo em malha encorpada com textura refinada e design limpo para transitar entre casual e sofisticado.",
    preco: 179.9,
    imagem_url:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80",
    categoria: "camisetas",
    estoque: 11,
    tamanhos_disponiveis: ["P", "M", "G", "GG"],
    cores_disponiveis: ["branco", "preto", "verde"],
  },
  {
    nome: "Axis Cargo Trousers",
    descricao:
      "Calca cargo de alfaiataria com bolsos utilitarios discretos e modelagem contemporanea.",
    preco: 279.9,
    imagem_url:
      "https://images.unsplash.com/photo-1506629905607-d9c297d5d95c?auto=format&fit=crop&w=1200&q=80",
    categoria: "calcas",
    estoque: 8,
    tamanhos_disponiveis: ["36", "38", "40", "42", "44"],
    cores_disponiveis: ["preto", "areia", "oliva"],
  },
  {
    nome: "Cloud Layer Hoodie",
    descricao:
      "Moletom com interior felpado, corte relaxado e paleta neutra para compor sobreposicoes elegantes.",
    preco: 229.9,
    imagem_url:
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=1200&q=80",
    categoria: "moletons",
    estoque: 9,
    tamanhos_disponiveis: ["P", "M", "G", "GG"],
    cores_disponiveis: ["cinza", "preto", "bege"],
  },
  {
    nome: "Nova Everyday Cap",
    descricao:
      "Bone estruturado com fecho ajustavel, aba curva e detalhe bordado para complementar o visual.",
    preco: 89.9,
    imagem_url:
      "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1200&q=80",
    categoria: "acessorios",
    estoque: 15,
    tamanhos_disponiveis: ["Unico"],
    cores_disponiveis: ["preto", "branco", "azul"],
  },
];

function serializeStringArray(values) {
  return JSON.stringify(Array.isArray(values) ? values : []);
}

function parseStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((item) => String(item).trim()).filter(Boolean) : [];
  } catch (error) {
    return [];
  }
}

function areStringArraysEqual(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
    return false;
  }

  return left.every((item, index) => item === right[index]);
}

async function connectDatabase() {
  if (!databasePromise) {
    databasePromise = open({
      filename: DATABASE_PATH,
      driver: sqlite3.Database,
    });
  }

  const db = await databasePromise;
  await db.exec("PRAGMA foreign_keys = ON;");
  return db;
}

async function getTableColumns(db, tableName) {
  return db.all(`PRAGMA table_info(${tableName})`);
}

async function tableExists(db, tableName) {
  const result = await db.get(
    `
      SELECT name
      FROM sqlite_master
      WHERE type = 'table' AND name = ?
    `,
    [tableName]
  );

  return Boolean(result);
}

async function createTables(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      verificado INTEGER NOT NULL DEFAULT 0,
      otp_code TEXT,
      otp_expira_em TEXT,
      role TEXT NOT NULL DEFAULT '${USER_ROLE_CLIENT}',
      criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      descricao TEXT NOT NULL,
      preco REAL NOT NULL,
      imagem_url TEXT NOT NULL,
      categoria TEXT NOT NULL,
      estoque INTEGER NOT NULL DEFAULT 0,
      tamanhos_disponiveis TEXT NOT NULL DEFAULT '[]',
      cores_disponiveis TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      tamanho TEXT NOT NULL,
      cor TEXT NOT NULL,
      estoque INTEGER NOT NULL DEFAULT 0,
      UNIQUE(product_id, tamanho, cor),
      FOREIGN KEY (product_id) REFERENCES produtos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS carrinho (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      produto_id INTEGER NOT NULL,
      tamanho_selecionado TEXT NOT NULL DEFAULT '',
      cor_selecionada TEXT NOT NULL DEFAULT '',
      quantidade INTEGER NOT NULL DEFAULT 1,
      criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(usuario_id, produto_id, tamanho_selecionado, cor_selecionada),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pendente',
      contato_nome TEXT NOT NULL,
      contato_email TEXT NOT NULL,
      endereco TEXT NOT NULL,
      cidade TEXT NOT NULL,
      cep TEXT NOT NULL,
      observacoes TEXT,
      subtotal REAL NOT NULL DEFAULT 0,
      frete REAL NOT NULL DEFAULT 0,
      prazo_entrega TEXT,
      criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      produto_id INTEGER NOT NULL,
      quantidade INTEGER NOT NULL,
      preco_unitario REAL NOT NULL,
      nome_produto TEXT NOT NULL,
      tamanho_selecionado TEXT NOT NULL DEFAULT '',
      cor_selecionada TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS order_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      data TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      subtotal REAL NOT NULL,
      frete REAL NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmado',
      contato_nome TEXT NOT NULL,
      contato_email TEXT NOT NULL,
      endereco TEXT NOT NULL,
      cidade TEXT NOT NULL,
      cep TEXT NOT NULL,
      observacoes TEXT,
      criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pedido_itens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL,
      produto_id INTEGER NOT NULL,
      nome_produto TEXT NOT NULL,
      preco_unitario REAL NOT NULL,
      quantidade INTEGER NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
      FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
    );
  `);
}

function buildVariantSeedRows({ sizes, colors, totalStock }) {
  const normalizedSizes = Array.isArray(sizes) ? sizes : [];
  const normalizedColors = Array.isArray(colors) ? colors : [];
  const combinations = [];

  for (const size of normalizedSizes) {
    for (const color of normalizedColors) {
      combinations.push({
        size,
        color,
        stock: 0,
      });
    }
  }

  if (!combinations.length) {
    return [];
  }

  const safeTotalStock = Math.max(0, Number.parseInt(totalStock, 10) || 0);
  const baseStock = Math.floor(safeTotalStock / combinations.length);
  const remainder = safeTotalStock % combinations.length;

  return combinations.map((variant, index) => ({
    ...variant,
    stock: baseStock + (index < remainder ? 1 : 0),
  }));
}

async function syncProductStock(db, productId) {
  const result = await db.get(
    `
      SELECT COALESCE(SUM(estoque), 0) AS total
      FROM product_variants
      WHERE product_id = ?
    `,
    [productId]
  );

  const totalStock = Number(result?.total || 0);

  await db.run(
    `
      UPDATE produtos
      SET estoque = ?
      WHERE id = ?
    `,
    [totalStock, productId]
  );

  return totalStock;
}

async function replaceProductVariants(db, productId, variantStocks) {
  await db.run(`DELETE FROM product_variants WHERE product_id = ?`, [productId]);

  if (!Array.isArray(variantStocks) || !variantStocks.length) {
    await syncProductStock(db, productId);
    return;
  }

  const statement = await db.prepare(
    `
      INSERT INTO product_variants (product_id, tamanho, cor, estoque)
      VALUES (?, ?, ?, ?)
    `
  );

  try {
    for (const variant of variantStocks) {
      await statement.run(
        productId,
        variant.size,
        variant.color,
        Math.max(0, Number.parseInt(variant.stock, 10) || 0)
      );
    }
  } finally {
    await statement.finalize();
  }

  await syncProductStock(db, productId);
}

async function ensureProductVariants(db) {
  const products = await db.all(
    `
      SELECT id, estoque, tamanhos_disponiveis, cores_disponiveis
      FROM produtos
      ORDER BY id ASC
    `
  );

  for (const product of products) {
    const variantCount = await db.get(
      `
        SELECT COUNT(*) AS total
        FROM product_variants
        WHERE product_id = ?
      `,
      [product.id]
    );

    if (Number(variantCount?.total || 0) === 0) {
      const sizes = parseStringArray(product.tamanhos_disponiveis);
      const colors = parseStringArray(product.cores_disponiveis);
      const seedRows = buildVariantSeedRows({
        sizes,
        colors,
        totalStock: product.estoque,
      });

      if (seedRows.length) {
        await replaceProductVariants(db, product.id, seedRows);
      } else {
        await syncProductStock(db, product.id);
      }

      continue;
    }

    await syncProductStock(db, product.id);
  }
}

async function ensureSchemaUpdates(db) {
  const userColumns = await getTableColumns(db, "usuarios");
  const hasRoleColumn = userColumns.some((column) => column.name === "role");

  if (!hasRoleColumn) {
    await db.exec(
      `ALTER TABLE usuarios ADD COLUMN role TEXT NOT NULL DEFAULT '${USER_ROLE_CLIENT}'`
    );
  }

  await db.run(`UPDATE usuarios SET role = ? WHERE role IS NULL OR TRIM(role) = ''`, [
    USER_ROLE_CLIENT,
  ]);

  const productColumns = await getTableColumns(db, "produtos");
  const hasStockColumn = productColumns.some((column) => column.name === "estoque");

  if (!hasStockColumn) {
    await db.exec(`ALTER TABLE produtos ADD COLUMN estoque INTEGER NOT NULL DEFAULT 0`);
    await db.run(`UPDATE produtos SET estoque = 12 WHERE estoque IS NULL OR estoque < 0`);
  }

  const hasSizesColumn = productColumns.some((column) => column.name === "tamanhos_disponiveis");
  const hasColorsColumn = productColumns.some((column) => column.name === "cores_disponiveis");

  if (!hasSizesColumn) {
    await db.exec(`ALTER TABLE produtos ADD COLUMN tamanhos_disponiveis TEXT NOT NULL DEFAULT '[]'`);
  }

  if (!hasColorsColumn) {
    await db.exec(`ALTER TABLE produtos ADD COLUMN cores_disponiveis TEXT NOT NULL DEFAULT '[]'`);
  }

  await db.run(
    `
      UPDATE produtos
      SET tamanhos_disponiveis = ?
      WHERE tamanhos_disponiveis IS NULL OR TRIM(tamanhos_disponiveis) = '' OR TRIM(tamanhos_disponiveis) = '[]'
    `,
    [serializeStringArray(["P", "M", "G", "GG"])]
  );

  await db.run(
    `
      UPDATE produtos
      SET cores_disponiveis = ?
      WHERE cores_disponiveis IS NULL OR TRIM(cores_disponiveis) = '' OR TRIM(cores_disponiveis) = '[]'
    `,
    [serializeStringArray(["preto", "branco"])]
  );

  const cartColumns = await getTableColumns(db, "carrinho");
  const hasCartSize = cartColumns.some((column) => column.name === "tamanho_selecionado");
  const hasCartColor = cartColumns.some((column) => column.name === "cor_selecionada");

  if (!hasCartSize || !hasCartColor) {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS carrinho_v2 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        produto_id INTEGER NOT NULL,
        tamanho_selecionado TEXT NOT NULL DEFAULT '',
        cor_selecionada TEXT NOT NULL DEFAULT '',
        quantidade INTEGER NOT NULL DEFAULT 1,
        criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(usuario_id, produto_id, tamanho_selecionado, cor_selecionada),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
      )
    `);

    await db.run(`
      INSERT INTO carrinho_v2 (
        id, usuario_id, produto_id, tamanho_selecionado, cor_selecionada, quantidade, criado_em, atualizado_em
      )
      SELECT
        id,
        usuario_id,
        produto_id,
        '',
        '',
        quantidade,
        criado_em,
        atualizado_em
      FROM carrinho
    `);

    await db.exec("DROP TABLE carrinho");
    await db.exec("ALTER TABLE carrinho_v2 RENAME TO carrinho");
  }

  const orderColumns = await getTableColumns(db, "orders");

  if (!orderColumns.some((column) => column.name === "prazo_entrega")) {
    await db.exec(`ALTER TABLE orders ADD COLUMN prazo_entrega TEXT`);
  }

  const orderItemColumns = await getTableColumns(db, "order_items");
  const hasOrderItemName = orderItemColumns.some((column) => column.name === "nome_produto");

  if (!hasOrderItemName) {
    await db.exec(`ALTER TABLE order_items ADD COLUMN nome_produto TEXT NOT NULL DEFAULT ''`);
    await db.run(
      `
        UPDATE order_items
        SET nome_produto = COALESCE(
          (SELECT nome FROM produtos WHERE produtos.id = order_items.produto_id),
          'Produto'
        )
        WHERE nome_produto = ''
      `
    );
  }

  if (!orderItemColumns.some((column) => column.name === "tamanho_selecionado")) {
    await db.exec(
      `ALTER TABLE order_items ADD COLUMN tamanho_selecionado TEXT NOT NULL DEFAULT ''`
    );
  }

  if (!orderItemColumns.some((column) => column.name === "cor_selecionada")) {
    await db.exec(`ALTER TABLE order_items ADD COLUMN cor_selecionada TEXT NOT NULL DEFAULT ''`);
  }

  if (!(await tableExists(db, "order_status_history"))) {
    await db.exec(`
      CREATE TABLE order_status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        data TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);
  }

  await ensureProductVariants(db);
}

async function seedInitialProducts(db) {
  const result = await db.get("SELECT COUNT(*) AS total FROM produtos");

  if (result.total > 0) {
    return;
  }

  const statement = await db.prepare(`
    INSERT INTO produtos (
      nome, descricao, preco, imagem_url, categoria, estoque, tamanhos_disponiveis, cores_disponiveis
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    for (const product of seedProducts) {
      await statement.run(
        product.nome,
        product.descricao,
        product.preco,
        product.imagem_url,
        product.categoria,
        product.estoque,
        serializeStringArray(product.tamanhos_disponiveis),
        serializeStringArray(product.cores_disponiveis)
      );
    }
  } finally {
    await statement.finalize();
  }
}

async function syncSeedProducts(db) {
  const fallbackSizes = ["P", "M", "G", "GG"];
  const fallbackColors = ["preto", "branco"];
  const seededRows = await db.all(
    `
      SELECT id, nome, imagem_url, tamanhos_disponiveis, cores_disponiveis
      FROM produtos
      WHERE id <= ?
      ORDER BY id ASC
    `,
    [seedProducts.length]
  );

  for (const row of seededRows) {
    const nextProduct = seedProducts[row.id - 1];

    if (!nextProduct) {
      continue;
    }

    const currentSizes = parseStringArray(row.tamanhos_disponiveis);
    const currentColors = parseStringArray(row.cores_disponiveis);
    const shouldBackfillSizes =
      currentSizes.length === 0 ||
      (areStringArraysEqual(currentSizes, fallbackSizes) &&
        !areStringArraysEqual(nextProduct.tamanhos_disponiveis, fallbackSizes));
    const shouldBackfillColors =
      currentColors.length === 0 ||
      (areStringArraysEqual(currentColors, fallbackColors) &&
        !areStringArraysEqual(nextProduct.cores_disponiveis, fallbackColors));

    if (shouldBackfillSizes || shouldBackfillColors) {
      await db.run(
        `
          UPDATE produtos
          SET
            tamanhos_disponiveis = ?,
            cores_disponiveis = ?
          WHERE id = ?
        `,
        [
          shouldBackfillSizes
            ? serializeStringArray(nextProduct.tamanhos_disponiveis)
            : serializeStringArray(currentSizes),
          shouldBackfillColors
            ? serializeStringArray(nextProduct.cores_disponiveis)
            : serializeStringArray(currentColors),
          row.id,
        ]
      );
    }

    if (row.imagem_url && !row.imagem_url.startsWith("/assets/products/")) {
      continue;
    }

    await db.run(
      `
        UPDATE produtos
        SET
          nome = ?,
          descricao = ?,
          preco = ?,
          imagem_url = ?,
          categoria = ?,
          estoque = ?,
          tamanhos_disponiveis = ?,
          cores_disponiveis = ?
        WHERE id = ?
      `,
      [
        nextProduct.nome,
        nextProduct.descricao,
        nextProduct.preco,
        nextProduct.imagem_url,
        nextProduct.categoria,
        nextProduct.estoque,
        serializeStringArray(nextProduct.tamanhos_disponiveis),
        serializeStringArray(nextProduct.cores_disponiveis),
        row.id,
      ]
    );
  }
}

async function initializeDatabase() {
  const db = await connectDatabase();
  await createTables(db);
  await ensureSchemaUpdates(db);
  await seedInitialProducts(db);
  await syncSeedProducts(db);
  await ensureProductVariants(db);
  return db;
}

function normalizeUser(row) {
  if (!row) {
    return null;
  }

  return {
    ...row,
    verificado: Boolean(row.verificado),
    role: row.role || USER_ROLE_CLIENT,
  };
}

function normalizeProduct(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    nome: row.nome,
    descricao: row.descricao,
    preco: Number(row.preco),
    imagem_url: row.imagem_url,
    categoria: row.categoria,
    estoque: Number(row.estoque),
    tamanhos_disponiveis: parseStringArray(row.tamanhos_disponiveis),
    cores_disponiveis: parseStringArray(row.cores_disponiveis),
  };
}

function normalizeProductVariant(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    product_id: row.product_id,
    tamanho: row.tamanho,
    cor: row.cor,
    estoque: Number(row.estoque),
  };
}

function normalizeOrder(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    usuario_id: row.usuario_id,
    total: Number(row.total),
    status: row.status,
    contato_nome: row.contato_nome,
    contato_email: row.contato_email,
    endereco: row.endereco,
    cidade: row.cidade,
    cep: row.cep,
    observacoes: row.observacoes,
    subtotal: Number(row.subtotal),
    frete: Number(row.frete),
    prazo_entrega: row.prazo_entrega,
    criado_em: row.criado_em,
    usuario_nome: row.usuario_nome,
    usuario_email: row.usuario_email,
    usuario_role: row.usuario_role,
  };
}

function normalizeOrderItem(row) {
  return {
    id: row.id,
    order_id: row.order_id,
    produto_id: row.produto_id,
    quantidade: Number(row.quantidade),
    preco_unitario: Number(row.preco_unitario),
    nome_produto: row.nome_produto,
    tamanho_selecionado: row.tamanho_selecionado || "",
    cor_selecionada: row.cor_selecionada || "",
    imagem_url: row.imagem_url,
  };
}

function normalizeStatusHistoryItem(row) {
  return {
    id: row.id,
    order_id: row.order_id,
    status: row.status,
    data: row.data,
  };
}

async function createUser({ nome, email, senhaHash, otpCode, otpExpiraEm, role }) {
  const db = await connectDatabase();
  const result = await db.run(
    `
      INSERT INTO usuarios (nome, email, senha_hash, verificado, otp_code, otp_expira_em, role)
      VALUES (?, ?, ?, 0, ?, ?, ?)
    `,
    [nome, email.toLowerCase(), senhaHash, otpCode, otpExpiraEm, role || USER_ROLE_CLIENT]
  );

  return findUserById(result.lastID);
}

async function deleteUserById(userId) {
  const db = await connectDatabase();
  const result = await db.run(
    `
      DELETE FROM usuarios
      WHERE id = ?
    `,
    [userId]
  );

  return result.changes;
}

async function findUserByEmail(email) {
  const db = await connectDatabase();
  const user = await db.get(
    `
      SELECT id, nome, email, senha_hash, verificado, otp_code, otp_expira_em, role, criado_em
      FROM usuarios
      WHERE email = ?
    `,
    [email.toLowerCase()]
  );

  return normalizeUser(user);
}

async function findUserById(id) {
  const db = await connectDatabase();
  const user = await db.get(
    `
      SELECT id, nome, email, senha_hash, verificado, otp_code, otp_expira_em, role, criado_em
      FROM usuarios
      WHERE id = ?
    `,
    [id]
  );

  return normalizeUser(user);
}

async function updateUserRole({ userId, role }) {
  const db = await connectDatabase();
  await db.run(
    `
      UPDATE usuarios
      SET role = ?
      WHERE id = ?
    `,
    [role, userId]
  );

  return findUserById(userId);
}

async function updateUserOtp({ userId, otpCode, otpExpiraEm }) {
  const db = await connectDatabase();
  await db.run(
    `
      UPDATE usuarios
      SET otp_code = ?, otp_expira_em = ?, verificado = 0
      WHERE id = ?
    `,
    [otpCode, otpExpiraEm, userId]
  );

  return findUserById(userId);
}

async function markUserAsVerified(userId) {
  const db = await connectDatabase();
  await db.run(
    `
      UPDATE usuarios
      SET verificado = 1, otp_code = NULL, otp_expira_em = NULL
      WHERE id = ?
    `,
    [userId]
  );

  return findUserById(userId);
}

async function updateUserName({ userId, nome }) {
  const db = await connectDatabase();
  await db.run(
    `
      UPDATE usuarios
      SET nome = ?
      WHERE id = ?
    `,
    [nome, userId]
  );

  return findUserById(userId);
}

async function updateUserPassword({ userId, senhaHash }) {
  const db = await connectDatabase();
  await db.run(
    `
      UPDATE usuarios
      SET senha_hash = ?
      WHERE id = ?
    `,
    [senhaHash, userId]
  );

  return findUserById(userId);
}

async function listProductVariantsByProductIds(productIds) {
  if (!productIds.length) {
    return [];
  }

  const db = await connectDatabase();
  const placeholders = productIds.map(() => "?").join(", ");
  const rows = await db.all(
    `
      SELECT id, product_id, tamanho, cor, estoque
      FROM product_variants
      WHERE product_id IN (${placeholders})
      ORDER BY tamanho ASC, cor ASC, id ASC
    `,
    productIds
  );

  return rows.map(normalizeProductVariant);
}

async function attachVariantsToProducts(products) {
  if (!products.length) {
    return [];
  }

  const variants = await listProductVariantsByProductIds(products.map((product) => product.id));
  const variantsByProductId = new Map();

  for (const variant of variants) {
    const group = variantsByProductId.get(variant.product_id) || [];
    group.push(variant);
    variantsByProductId.set(variant.product_id, group);
  }

  return products.map((product) => ({
    ...product,
    variants: variantsByProductId.get(product.id) || [],
  }));
}

async function getProductVariantBySelection({ productId, size, color }) {
  const db = await connectDatabase();
  const row = await db.get(
    `
      SELECT id, product_id, tamanho, cor, estoque
      FROM product_variants
      WHERE product_id = ? AND tamanho = ? AND cor = ?
    `,
    [productId, size, color]
  );

  return normalizeProductVariant(row);
}

async function listProducts({ category, search, limit } = {}) {
  const db = await connectDatabase();
  const conditions = [];
  const params = [];

  if (category) {
    conditions.push("LOWER(categoria) = LOWER(?)");
    params.push(category);
  }

  if (search) {
    conditions.push("(LOWER(nome) LIKE LOWER(?) OR LOWER(descricao) LIKE LOWER(?))");
    params.push(`%${search}%`, `%${search}%`);
  }

  let query = `
    SELECT
      id,
      nome,
      descricao,
      preco,
      imagem_url,
      categoria,
      estoque,
      tamanhos_disponiveis,
      cores_disponiveis
    FROM produtos
  `;

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  query += " ORDER BY id ASC";

  if (limit) {
    query += " LIMIT ?";
    params.push(limit);
  }

  const rows = await db.all(query, params);
  return attachVariantsToProducts(rows.map(normalizeProduct));
}

async function listCategories() {
  const db = await connectDatabase();
  const rows = await db.all(
    `
      SELECT DISTINCT categoria
      FROM produtos
      ORDER BY categoria ASC
    `
  );

  return rows.map((row) => row.categoria);
}

async function getProductById(id) {
  const db = await connectDatabase();
  const product = await db.get(
    `
      SELECT
        id,
        nome,
        descricao,
        preco,
        imagem_url,
        categoria,
        estoque,
        tamanhos_disponiveis,
        cores_disponiveis
      FROM produtos
      WHERE id = ?
    `,
    [id]
  );

  const normalizedProduct = normalizeProduct(product);

  if (!normalizedProduct) {
    return null;
  }

  const [productWithVariants] = await attachVariantsToProducts([normalizedProduct]);
  return productWithVariants;
}

async function createProduct({
  nome,
  descricao,
  preco,
  imagemUrl,
  categoria,
  tamanhosDisponiveis,
  coresDisponiveis,
  variantStocks,
}) {
  const db = await connectDatabase();
  const result = await db.run(
    `
      INSERT INTO produtos (
        nome, descricao, preco, imagem_url, categoria, estoque, tamanhos_disponiveis, cores_disponiveis
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      nome,
      descricao,
      preco,
      imagemUrl,
      categoria,
      0,
      serializeStringArray(tamanhosDisponiveis),
      serializeStringArray(coresDisponiveis),
    ]
  );

  await replaceProductVariants(db, result.lastID, variantStocks);
  return getProductById(result.lastID);
}

async function updateProductById(
  productId,
  { nome, descricao, preco, imagemUrl, categoria, tamanhosDisponiveis, coresDisponiveis, variantStocks }
) {
  const db = await connectDatabase();
  await db.run(
    `
      UPDATE produtos
      SET
        nome = ?,
        descricao = ?,
        preco = ?,
        imagem_url = ?,
        categoria = ?,
        tamanhos_disponiveis = ?,
        cores_disponiveis = ?
      WHERE id = ?
    `,
    [
      nome,
      descricao,
      preco,
      imagemUrl,
      categoria,
      serializeStringArray(tamanhosDisponiveis),
      serializeStringArray(coresDisponiveis),
      productId,
    ]
  );

  await replaceProductVariants(db, productId, variantStocks);
  return getProductById(productId);
}

async function updateProductStockById(productId, estoque) {
  const db = await connectDatabase();
  await db.run(
    `
      UPDATE produtos
      SET estoque = ?
      WHERE id = ?
    `,
    [estoque, productId]
  );

  return getProductById(productId);
}

async function hasOrdersForProduct(productId) {
  const db = await connectDatabase();
  const result = await db.get(
    `
      SELECT COUNT(*) AS total
      FROM order_items
      WHERE produto_id = ?
    `,
    [productId]
  );

  return result.total > 0;
}

async function deleteProductById(productId) {
  const db = await connectDatabase();
  const result = await db.run(
    `
      DELETE FROM produtos
      WHERE id = ?
    `,
    [productId]
  );

  return result.changes;
}

async function addCartItem({ userId, productId, size, color, quantity }) {
  const db = await connectDatabase();
  const existing = await db.get(
    `
      SELECT id, quantidade
      FROM carrinho
      WHERE usuario_id = ? AND produto_id = ? AND tamanho_selecionado = ? AND cor_selecionada = ?
    `,
    [userId, productId, size, color]
  );

  if (existing) {
    await db.run(
      `
        UPDATE carrinho
        SET quantidade = ?, atualizado_em = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [existing.quantidade + quantity, existing.id]
    );

    return existing.id;
  }

  const result = await db.run(
    `
      INSERT INTO carrinho (usuario_id, produto_id, tamanho_selecionado, cor_selecionada, quantidade)
      VALUES (?, ?, ?, ?, ?)
    `,
    [userId, productId, size, color, quantity]
  );

  return result.lastID;
}

async function getCartItemById({ userId, cartItemId }) {
  const db = await connectDatabase();
  return db.get(
    `
      SELECT id, usuario_id, produto_id, tamanho_selecionado, cor_selecionada, quantidade
      FROM carrinho
      WHERE id = ? AND usuario_id = ?
    `,
    [cartItemId, userId]
  );
}

async function updateCartItemQuantity({ userId, cartItemId, quantity }) {
  const db = await connectDatabase();
  await db.run(
    `
      UPDATE carrinho
      SET quantidade = ?, atualizado_em = CURRENT_TIMESTAMP
      WHERE id = ? AND usuario_id = ?
    `,
    [quantity, cartItemId, userId]
  );

  return getCartItemById({ userId, cartItemId });
}

async function removeCartItem({ userId, cartItemId }) {
  const db = await connectDatabase();
  const result = await db.run(
    `
      DELETE FROM carrinho
      WHERE id = ? AND usuario_id = ?
    `,
    [cartItemId, userId]
  );

  return result.changes;
}

async function clearCartByUserId(userId) {
  const db = await connectDatabase();
  await db.run("DELETE FROM carrinho WHERE usuario_id = ?", [userId]);
}

async function listCartItemsByUserId(userId) {
  const db = await connectDatabase();
  return db.all(
    `
      SELECT
        carrinho.id,
        carrinho.quantidade,
        carrinho.tamanho_selecionado,
        carrinho.cor_selecionada,
        produtos.id AS produto_id,
        produtos.nome,
        produtos.descricao,
        produtos.preco,
        produtos.imagem_url,
        produtos.categoria,
        produtos.estoque,
        COALESCE(product_variants.estoque, 0) AS variante_estoque,
        produtos.tamanhos_disponiveis,
        produtos.cores_disponiveis
      FROM carrinho
      INNER JOIN produtos ON produtos.id = carrinho.produto_id
      LEFT JOIN product_variants
        ON product_variants.product_id = carrinho.produto_id
        AND product_variants.tamanho = carrinho.tamanho_selecionado
        AND product_variants.cor = carrinho.cor_selecionada
      WHERE carrinho.usuario_id = ?
      ORDER BY carrinho.atualizado_em DESC, carrinho.id DESC
    `,
    [userId]
  );
}

async function createOrder({
  userId,
  subtotal,
  frete,
  total,
  status = "pendente",
  contatoNome,
  contatoEmail,
  endereco,
  cidade,
  cep,
  observacoes,
  prazoEntrega,
  items,
}) {
  const db = await connectDatabase();
  await db.exec("BEGIN TRANSACTION");

  try {
    const touchedProductIds = new Set();

    for (const item of items) {
      const updated = await db.run(
        `
          UPDATE product_variants
          SET estoque = estoque - ?
          WHERE product_id = ? AND tamanho = ? AND cor = ? AND estoque >= ?
        `,
        [
          item.quantity,
          item.product.id,
          item.selectedSize,
          item.selectedColor,
          item.quantity,
        ]
      );

      if (updated.changes === 0) {
        const error = new Error(`Estoque insuficiente para o produto ${item.product.name}.`);
        error.statusCode = 400;
        throw error;
      }

      touchedProductIds.add(item.product.id);
    }

    for (const productId of touchedProductIds) {
      await syncProductStock(db, productId);
    }

    const result = await db.run(
      `
        INSERT INTO orders (
          usuario_id, total, status, contato_nome, contato_email, endereco,
          cidade, cep, observacoes, subtotal, frete, prazo_entrega
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        total,
        status,
        contatoNome,
        contatoEmail,
        endereco,
        cidade,
        cep,
        observacoes || null,
        subtotal,
        frete,
        prazoEntrega || null,
      ]
    );

    const statement = await db.prepare(`
      INSERT INTO order_items (
        order_id, produto_id, quantidade, preco_unitario, nome_produto, tamanho_selecionado, cor_selecionada
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      for (const item of items) {
        await statement.run(
          result.lastID,
          item.product.id,
          item.quantity,
          item.product.price,
          item.product.name,
          item.selectedSize,
          item.selectedColor
        );
      }
    } finally {
      await statement.finalize();
    }

    await db.run(`INSERT INTO order_status_history (order_id, status) VALUES (?, ?)`, [
      result.lastID,
      status,
    ]);

    await clearCartByUserId(userId);
    await db.exec("COMMIT");

    return getOrderById(result.lastID);
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

async function listOrderItemsByOrderIds(orderIds) {
  if (!orderIds.length) {
    return [];
  }

  const db = await connectDatabase();
  const placeholders = orderIds.map(() => "?").join(", ");
  const rows = await db.all(
    `
      SELECT
        order_items.id,
        order_items.order_id,
        order_items.produto_id,
        order_items.quantidade,
        order_items.preco_unitario,
        order_items.nome_produto,
        order_items.tamanho_selecionado,
        order_items.cor_selecionada,
        produtos.imagem_url
      FROM order_items
      LEFT JOIN produtos ON produtos.id = order_items.produto_id
      WHERE order_items.order_id IN (${placeholders})
      ORDER BY order_items.id ASC
    `,
    orderIds
  );

  return rows.map(normalizeOrderItem);
}

async function listOrderStatusHistoryByOrderIds(orderIds) {
  if (!orderIds.length) {
    return [];
  }

  const db = await connectDatabase();
  const placeholders = orderIds.map(() => "?").join(", ");
  const rows = await db.all(
    `
      SELECT id, order_id, status, data
      FROM order_status_history
      WHERE order_id IN (${placeholders})
      ORDER BY data ASC, id ASC
    `,
    orderIds
  );

  return rows.map(normalizeStatusHistoryItem);
}

async function attachItemsToOrders(orders) {
  const items = await listOrderItemsByOrderIds(orders.map((order) => order.id));
  const itemsByOrderId = new Map();

  for (const item of items) {
    const group = itemsByOrderId.get(item.order_id) || [];
    group.push(item);
    itemsByOrderId.set(item.order_id, group);
  }

  return orders.map((order) => ({
    ...order,
    items: itemsByOrderId.get(order.id) || [],
  }));
}

async function attachStatusHistoryToOrders(orders) {
  const rows = await listOrderStatusHistoryByOrderIds(orders.map((order) => order.id));
  const historyByOrderId = new Map();

  for (const row of rows) {
    const group = historyByOrderId.get(row.order_id) || [];
    group.push(row);
    historyByOrderId.set(row.order_id, group);
  }

  return orders.map((order) => ({
    ...order,
    status_history: historyByOrderId.get(order.id) || [],
  }));
}

async function hydrateOrders(orders) {
  const withItems = await attachItemsToOrders(orders);
  return attachStatusHistoryToOrders(withItems);
}

async function listOrdersByUserId(userId) {
  const db = await connectDatabase();
  const rows = await db.all(
    `
      SELECT
        orders.id,
        orders.usuario_id,
        orders.total,
        orders.status,
        orders.contato_nome,
        orders.contato_email,
        orders.endereco,
        orders.cidade,
        orders.cep,
        orders.observacoes,
        orders.subtotal,
        orders.frete,
        orders.prazo_entrega,
        orders.criado_em,
        usuarios.nome AS usuario_nome,
        usuarios.email AS usuario_email,
        usuarios.role AS usuario_role
      FROM orders
      INNER JOIN usuarios ON usuarios.id = orders.usuario_id
      WHERE orders.usuario_id = ?
      ORDER BY orders.criado_em DESC, orders.id DESC
    `,
    [userId]
  );

  return hydrateOrders(rows.map(normalizeOrder));
}

async function listAllOrders() {
  const db = await connectDatabase();
  const rows = await db.all(
    `
      SELECT
        orders.id,
        orders.usuario_id,
        orders.total,
        orders.status,
        orders.contato_nome,
        orders.contato_email,
        orders.endereco,
        orders.cidade,
        orders.cep,
        orders.observacoes,
        orders.subtotal,
        orders.frete,
        orders.prazo_entrega,
        orders.criado_em,
        usuarios.nome AS usuario_nome,
        usuarios.email AS usuario_email,
        usuarios.role AS usuario_role
      FROM orders
      INNER JOIN usuarios ON usuarios.id = orders.usuario_id
      ORDER BY orders.criado_em DESC, orders.id DESC
    `
  );

  return hydrateOrders(rows.map(normalizeOrder));
}

async function getOrderById(orderId) {
  const db = await connectDatabase();
  const row = await db.get(
    `
      SELECT
        orders.id,
        orders.usuario_id,
        orders.total,
        orders.status,
        orders.contato_nome,
        orders.contato_email,
        orders.endereco,
        orders.cidade,
        orders.cep,
        orders.observacoes,
        orders.subtotal,
        orders.frete,
        orders.prazo_entrega,
        orders.criado_em,
        usuarios.nome AS usuario_nome,
        usuarios.email AS usuario_email,
        usuarios.role AS usuario_role
      FROM orders
      INNER JOIN usuarios ON usuarios.id = orders.usuario_id
      WHERE orders.id = ?
    `,
    [orderId]
  );

  const order = normalizeOrder(row);

  if (!order) {
    return null;
  }

  const [hydratedOrder] = await hydrateOrders([order]);
  return hydratedOrder;
}

async function getOrderByIdForUser({ userId, orderId }) {
  const order = await getOrderById(orderId);

  if (!order || order.usuario_id !== userId) {
    return null;
  }

  return order;
}

async function updateOrderStatus({ orderId, status }) {
  const db = await connectDatabase();
  const currentOrder = await db.get(`SELECT status FROM orders WHERE id = ?`, [orderId]);

  if (!currentOrder) {
    return null;
  }

  await db.run(`UPDATE orders SET status = ? WHERE id = ?`, [status, orderId]);

  if (currentOrder.status !== status) {
    await db.run(`INSERT INTO order_status_history (order_id, status) VALUES (?, ?)`, [
      orderId,
      status,
    ]);
  }

  return getOrderById(orderId);
}

module.exports = {
  USER_ROLE_ADMIN,
  USER_ROLE_CLIENT,
  addCartItem,
  clearCartByUserId,
  connectDatabase,
  createOrder,
  createProduct,
  createUser,
  deleteProductById,
  deleteUserById,
  findUserByEmail,
  findUserById,
  getCartItemById,
  getOrderById,
  getOrderByIdForUser,
  getProductById,
  getProductVariantBySelection,
  hasOrdersForProduct,
  initializeDatabase,
  listAllOrders,
  listCartItemsByUserId,
  listCategories,
  listOrdersByUserId,
  listProducts,
  markUserAsVerified,
  removeCartItem,
  updateCartItemQuantity,
  updateOrderStatus,
  updateProductById,
  updateProductStockById,
  updateUserName,
  updateUserOtp,
  updateUserPassword,
  updateUserRole,
};
