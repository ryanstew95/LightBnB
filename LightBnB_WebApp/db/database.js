const { Pool } = require("pg");

const pool = new Pool({
  user: "labber",
  password: "labber",
  host: "localhost",
  database: "lightbnb",
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */

const getUserWithEmail = function (email) {
  return pool
    .query("SELECT * FROM users WHERE email = $1", [email])
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      console.error(err);
      throw err;
    });
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */

const getUserWithId = function (id) {
  return pool
    .query("SELECT * FROM users WHERE id = $1", [id])
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => console.log(err));
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */

const addUser = function(user) {
  return pool
    .query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING  *;",
      [user.name, user.email, user.password]
    )
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => console.log(err));
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */

const getAllReservations = function(guestId, limit = 10) {
  const queryString = `
  SELECT reservations.*, properties.*, AVG(rating) as average_rating 
  FROM reservations 
  JOIN properties ON properties.id = property_id 
  JOIN property_reviews ON property_reviews.property_id = properties.id 
  WHERE reservations.guest_id = $1 
  GROUP BY reservations.id, properties.id, cost_per_night 
  ORDER BY start_date LIMIT 10;
  `;

  return pool
    .query(queryString, [guestId])
    .then((result) => {
      return result.rows;
    })
    .catch((err) => console.log(err));
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

const getAllProperties = function(options, limit = 10) {

  const queryParams = [];

  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  GROUP BY properties.id
  `;

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }
  if (options.owner_id) {
    queryParams.push(options.owner_id);
    if (queryParams.length > 0) {
      queryString += `AND properties.owner_id = $${queryParams.length} `;
    } else {
      queryString += `WHERE properties.owner_id = $${queryParams.length} `;
    }
  }

  if (options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100);
    if (queryParams.length > 0) {
      queryString += `AND cost_per_night >= $${queryParams.length} `;
    } else {
      queryString += `WHERE cost_per_night >= $${queryParams.length} `;
    }
  }

  if (options.maximum_price_per_night) {
    queryParams.push(options.maximum_price_per_night * 100);
    if (queryParams.length > 0) {
      queryString += `AND cost_per_night <= $${queryParams.length} `;
    } else {
      queryString += `WHERE cost_per_night <= $${queryParams.length} `;
    }
  }

  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    if (queryParams.length > 0) {
      queryString += `AND property_reviews.rating >= $${queryParams.length} `;
    } else {
      queryString += `WHERE property_reviews.rating >= $${queryParams.length} `;
    }
  }

  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  `;

  return pool
    .query(queryString)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {});
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */

const addProperty = function (property) {
  const queryParams = [
    property.owner_id,
    property.title,
    property.description,
    property.thumbnail_photo_url,
    property.cover_photo_url,
    property.cost_per_night,
    property.street,
    property.city,
    property.province,
    property.post_code,
    property.country,
    property.parking_spaces,
    property.number_of_bathrooms,
    property.number_of_bedrooms
  ];

  const queryString = `
    INSERT INTO properties (
      owner_id,
      title,
      description,
      thumbnail_photo_url,
      cover_photo_url,
      cost_per_night * 100,
      street,
      city,
      province,
      post_code,
      country,
      parking_spaces,
      number_of_bathrooms,
      number_of_bedrooms
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
    )
    RETURNING *;
  `;

  return pool.query(queryString, queryParams)
    .then((result) => result.rows[0]);
};


module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
