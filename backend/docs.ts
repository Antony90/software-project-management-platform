import swaggerDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Risk Evaluator',
    version: '1.0.0',
  },
  servers: [],
};

const options = {
    swaggerDefinition,
    apis: ['./routes/*.ts']
}

export const swaggerSpec = swaggerDoc(options)