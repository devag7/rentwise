CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('landlord', 'tenant') NOT NULL
);

CREATE TABLE IF NOT EXISTS areas (
    area_id INT AUTO_INCREMENT PRIMARY KEY,
    area_name VARCHAR(255) NOT NULL,
    average_rent_1bhk INT,
    average_rent_2bhk INT,
    average_rent_3bhk INT,
    average_rent_1rk INT,
    average_rent_pg INT
);

CREATE TABLE IF NOT EXISTS properties (
    property_id INT AUTO_INCREMENT PRIMARY KEY,
    landlord_id INT NOT NULL,
    area_id INT NOT NULL,
    address VARCHAR(255) NOT NULL,
    property_type ENUM('1BHK', '2BHK', '3BHK', '1RK', 'PG') NOT NULL,
    size INT NOT NULL,
    rent INT NOT NULL,
    preferences TEXT,
    image_data MEDIUMBLOB,
    landlord_phone VARCHAR(20),
    google_maps_link VARCHAR(512),
    FOREIGN KEY (landlord_id) REFERENCES users(user_id),
    FOREIGN KEY (area_id) REFERENCES areas(area_id)
);

CREATE TABLE IF NOT EXISTS price_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    area_id INT NOT NULL,
    property_type ENUM('1BHK', '2BHK', '3BHK', '1RK', 'PG') NOT NULL,
    year INT NOT NULL,
    average_rent INT NOT NULL,
    FOREIGN KEY (area_id) REFERENCES areas(area_id)
);