CREATE TYPE role_name AS ENUM ('ROLE_CUSTOMER', 'ROLE_ADMIN', 'ROLE_DELIVERY_BOY');
CREATE TYPE order_status AS ENUM ('PENDING', 'ACCEPTED', 'READY_TO_PICK', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');
CREATE TYPE order_payment_method AS ENUM ('ONLINE', 'COD');

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name role_name NOT NULL UNIQUE
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    phone_number VARCHAR(20),
    role_id INTEGER NOT NULL REFERENCES roles(id)
);

CREATE INDEX ix_users_email ON users(email);

CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    image_url VARCHAR(1000)
);

CREATE TABLE system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(255) NOT NULL UNIQUE,
    config_value VARCHAR(255) NOT NULL
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES users(id),
    delivery_boy_id INTEGER REFERENCES users(id),
    delivery_address VARCHAR(500) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    status order_status NOT NULL,
    order_time TIMESTAMP NOT NULL,
    delivered_at TIMESTAMP,
    payment_method order_payment_method NOT NULL,
    CONSTRAINT orders_status_check CHECK (status IN ('PENDING', 'ACCEPTED', 'READY_TO_PICK', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'))
);

CREATE INDEX ix_orders_customer_id ON orders(customer_id);
CREATE INDEX ix_orders_delivery_boy_id ON orders(delivery_boy_id);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    salad_id INTEGER NOT NULL REFERENCES menu_items(id),
    quantity INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL
);

CREATE INDEX ix_order_items_order_id ON order_items(order_id);
