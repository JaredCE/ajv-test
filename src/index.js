const SchemaValidator = require('./SchemaValidator');
const Lock = require('./Lock');

const fs = require('fs');
const path = require('path');

const lock = new Lock();
const schemaValidator = new SchemaValidator(lock);

const getData = (filenames) => {
  return filenames.map((filename) => {
    const pathToFile = path.join(__dirname, '../data', filename);

    const file = fs.readFileSync(pathToFile);
    return JSON.parse(file.toString());
  });
}

const main = async () => {
  const data = getData(['good-data.json','good-data.json','bad-data.json', 'good-data.json']);

  const validatedData = await schemaValidator.validateData(data)
    .catch((err) => {
      throw err;
    });
  validatedData.forEach((validatedDatum) => {
    if (validatedDatum.validatedData.valid === false) {
      if (validatedDatum.validatedData.validate.errors === null) {
        throw new Error('not expecting null data')
      }
    }
  })
};

main()
  .catch((err) => {
    console.log(err);
  });
