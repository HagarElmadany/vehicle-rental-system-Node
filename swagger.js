const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Vehicle Rental System API",
      version: "1.0.0",
      description:
        "A comprehensive vehicle rental system API with authentication, booking, payments, and agreement management",
      contact: {
        name: "API Support",
        email: "support@vehiclerental.com",
      },
    },
    servers: [
      {
        url: process.env.BASE_URL || "http://localhost:5000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string", enum: ["client", "agent", "admin"] },
            phone: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Car: {
          type: "object",
          properties: {
            _id: { type: "string" },
            brand: { type: "string" },
            model: { type: "string" },
            year: { type: "number" },
            licensePlate: { type: "string" },
            transmission: { type: "string", enum: ["automatic", "manual"] },
            fuel_type: { type: "string" },
            seats: { type: "number" },
            color: { type: "string" },
            rentalRatePerDay: { type: "number" },
            rentalRatePerHour: { type: "number" },
            depositRequired: { type: "number" },
            insuranceStatus: { type: "string" },
            availability: { type: "boolean" },
            agent: { type: "string" },
          },
        },
        Booking: {
          type: "object",
          properties: {
            _id: { type: "string" },
            clientId: { type: "string" },
            carId: { type: "string" },
            agent: { type: "string" },
            startDate: { type: "string", format: "date" },
            endDate: { type: "string", format: "date" },
            totalCost: { type: "number" },
            billingName: { type: "string" },
            billingPhone: { type: "string" },
            clientEmail: { type: "string", format: "email" },
            pickupLocation: { type: "string" },
            dropoffLocation: { type: "string" },
            status: {
              type: "string",
              enum: ["pending", "paid", "cancelled", "completed"],
            },
            with_driver: { type: "boolean" },
          },
        },
        Agreement: {
          type: "object",
          properties: {
            _id: { type: "string" },
            bookingId: { type: "string" },
            clientId: { type: "string" },
            agentId: { type: "string" },
            documentUrl: { type: "string" },
            signatureData: { type: "string" },
            status: { type: "string", enum: ["pending", "signed", "expired"] },
            generatedAt: { type: "string", format: "date-time" },
            signedAt: { type: "string", format: "date-time" },
            ipAddress: { type: "string" },
            userAgent: { type: "string" },
          },
        },
        Error: {
          type: "object",
          properties: {
            statusCode: { type: "number" },
            message: { type: "string" },
            errors: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
    paths: {
      // Auth Routes
      "/api/auth/register": {
        post: {
          tags: ["Authentication"],
          summary: "Register a new user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "password", "role"],
                  properties: {
                    name: { type: "string", minLength: 3 },
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 6 },
                    role: { type: "string", enum: ["client", "agent"] },
                    phone: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "User registered successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      user: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Authentication"],
          summary: "Login user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Login successful",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      token: { type: "string" },
                      user: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
            401: {
              description: "Invalid credentials",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      // Car Routes
      "/api/cars": {
        get: {
          tags: ["Cars"],
          summary: "Get all cars",
          parameters: [
            { name: "page", in: "query", schema: { type: "number" } },
            { name: "limit", in: "query", schema: { type: "number" } },
            { name: "brand", in: "query", schema: { type: "string" } },
            { name: "model", in: "query", schema: { type: "string" } },
          ],
          responses: {
            200: {
              description: "List of cars",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      cars: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Car" },
                      },
                      pagination: {
                        type: "object",
                        properties: {
                          page: { type: "number" },
                          limit: { type: "number" },
                          total: { type: "number" },
                          pages: { type: "number" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/cars/{id}": {
        get: {
          tags: ["Cars"],
          summary: "Get car by ID",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Car details",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Car" },
                },
              },
            },
            404: {
              description: "Car not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      // Agent Car Routes
      "/api/agent/cars": {
        get: {
          tags: ["Agent Cars"],
          summary: "Get agent cars",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Agent cars list",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Car" },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Agent Cars"],
          summary: "Add new car",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["brand", "model", "year", "licensePlate"],
                  properties: {
                    brand: { type: "string" },
                    model: { type: "string" },
                    year: { type: "number" },
                    licensePlate: { type: "string" },
                    transmission: { type: "string" },
                    fuel_type: { type: "string" },
                    seats: { type: "number" },
                    color: { type: "string" },
                    rentalRatePerDay: { type: "number" },
                    rentalRatePerHour: { type: "number" },
                    depositRequired: { type: "number" },
                    images: {
                      type: "array",
                      items: { type: "string", format: "binary" },
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Car created successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Car" },
                },
              },
            },
          },
        },
      },

      // Booking Routes
      "/api/bookings": {
        get: {
          tags: ["Bookings"],
          summary: "Get user bookings",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "User bookings",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Booking" },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Bookings"],
          summary: "Create new booking",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "carId",
                    "startDate",
                    "endDate",
                    "billingName",
                    "billingPhone",
                    "clientEmail",
                    "pickupLocation",
                    "dropoffLocation",
                  ],
                  properties: {
                    carId: { type: "string" },
                    startDate: { type: "string", format: "date" },
                    endDate: { type: "string", format: "date" },
                    billingName: { type: "string" },
                    billingPhone: { type: "string" },
                    clientEmail: { type: "string", format: "email" },
                    pickupLocation: { type: "string" },
                    dropoffLocation: { type: "string" },
                    with_driver: { type: "boolean" },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Booking created successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Booking" },
                },
              },
            },
          },
        },
      },
      "/api/bookings/{id}": {
        get: {
          tags: ["Bookings"],
          summary: "Get booking by ID",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Booking details",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Booking" },
                },
              },
            },
          },
        },
        put: {
          tags: ["Bookings"],
          summary: "Update booking",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                      enum: ["pending", "paid", "cancelled", "completed"],
                    },
                    startDate: { type: "string", format: "date" },
                    endDate: { type: "string", format: "date" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Booking updated successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Booking" },
                },
              },
            },
          },
        },
        delete: {
          tags: ["Bookings"],
          summary: "Cancel booking",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Booking cancelled successfully" },
          },
        },
      },

      // Payment Routes
      "/api/payments/create-payment-intent": {
        post: {
          tags: ["Payments"],
          summary: "Create payment intent",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["bookingId"],
                  properties: {
                    bookingId: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Payment intent created",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      clientSecret: { type: "string" },
                      paymentIntentId: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/payments/confirm": {
        post: {
          tags: ["Payments"],
          summary: "Confirm payment",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["paymentIntentId", "bookingId"],
                  properties: {
                    paymentIntentId: { type: "string" },
                    bookingId: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Payment confirmed successfully" },
          },
        },
      },

      // Agreement Routes
      "/api/agreements/generate/{bookingId}": {
        post: {
          tags: ["Agreements"],
          summary: "Generate agreement for booking",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "bookingId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    signature: {
                      type: "string",
                      description: "Base64 encoded signature",
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Agreement generated successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      agreement: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          documentUrl: { type: "string" },
                          status: { type: "string" },
                          signedAt: { type: "string", format: "date-time" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/agreements/sign/{agreementId}": {
        put: {
          tags: ["Agreements"],
          summary: "Sign existing agreement",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "agreementId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["signature"],
                  properties: {
                    signature: {
                      type: "string",
                      description: "Base64 encoded signature",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Agreement signed successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      agreement: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          documentUrl: { type: "string" },
                          status: { type: "string" },
                          signedAt: { type: "string", format: "date-time" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/agreements/{agreementId}": {
        get: {
          tags: ["Agreements"],
          summary: "Get agreement details",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "agreementId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Agreement details",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Agreement" },
                },
              },
            },
          },
        },
      },
      "/api/agreements/download/{agreementId}": {
        get: {
          tags: ["Agreements"],
          summary: "Download agreement PDF",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "agreementId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "PDF file download",
              content: {
                "application/pdf": {
                  schema: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
      },

      // Search Routes
      "/api/search/cars": {
        get: {
          tags: ["Search"],
          summary: "Search available cars",
          parameters: [
            { name: "location", in: "query", schema: { type: "string" } },
            {
              name: "startDate",
              in: "query",
              schema: { type: "string", format: "date" },
            },
            {
              name: "endDate",
              in: "query",
              schema: { type: "string", format: "date" },
            },
          ],
          responses: {
            200: {
              description: "Available cars matching search criteria",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Car" },
                  },
                },
              },
            },
          },
        },
      },

      // Admin Routes
      "/api/admin/users": {
        get: {
          tags: ["Admin"],
          summary: "Get all users (Admin only)",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "List of all users",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
        },
      },
      "/api/admin/bookings": {
        get: {
          tags: ["Admin"],
          summary: "Get all bookings (Admin only)",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "List of all bookings",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Booking" },
                  },
                },
              },
            },
          },
        },
      },
      "/api/admin/cars": {
        get: {
          tags: ["Admin"],
          summary: "Get all cars (Admin only)",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "List of all cars",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Car" },
                  },
                },
              },
            },
          },
        },
      },

      // Driver License Verification
      "/api/verify-license": {
        post: {
          tags: ["Verification"],
          summary: "Verify driver license",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["licenseImage"],
                  properties: {
                    licenseImage: { type: "string", format: "binary" },
                    licenseNumber: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "License verification result",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      verified: { type: "boolean" },
                      extractedData: { type: "object" },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ["./routes/*.js", "./controllers/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec,
};
