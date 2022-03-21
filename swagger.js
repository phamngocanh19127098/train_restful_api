import swaggerAutogen from 'swagger-autogen'

const doc = {
    info: {
      title: 'My API',
      description: 'Description',
    },
    host: 'localhost:3000',
    schemes: ['http'],
  };
  const outputFile = './swagger-output.json';
  const endpointsFiles = ['./middlewares/route.mdw.js'];
  swaggerAutogen()(outputFile, endpointsFiles, doc).then(async()=>{
      await import ('./app.js');
  });