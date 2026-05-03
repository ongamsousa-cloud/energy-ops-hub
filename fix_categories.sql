INSERT INTO categorias (nome) VALUES ('Geral') ON CONFLICT (nome) DO NOTHING;
