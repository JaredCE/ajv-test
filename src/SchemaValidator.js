const AJV = require('ajv');
const fs = require('fs');
const path = require('path');

class SchemaValidator {
  constructor(lock) {
    this.lock = lock;
    this.schemaPath = 'main.schema.json';

    this.ajv = new AJV({
      $data: true,
      allErrors: true,
      useDefaults: true,
      verbose: true,
      format: 'full',
      loadSchema: this._loadRelatedSchema,
    });

    require('ajv-keywords')(this.ajv);
  }

  async validateData(data) {
    return Promise.all(data.map(async (datum) => {
      const unlock = await this.lock.lock();
      const validatedData = await this._validateDatum(datum)
        .catch(async (err) => {
          await unlock();
          throw err;
        });
      await unlock();
      return {
        id: datum.id,
        validatedData: validatedData,
      };
    }));
  }

  async _validateDatum(datum) {
    const schema = await this._getCompiledSchema(this.schemaPath)
      .catch((err) => {
        throw err;
      });
    return await this._validatedSchema(schema, datum)
      .catch((err) => {
        throw err;
      });
  }

  async _validatedSchema(schema, data) {
    const validData = await this.ajv.compileAsync(schema)
      .catch((err) => {
        throw err;
      });

    return {
      valid: validData(data),
      validate: validData,
    };
  }

  async _getCompiledSchema(schemaPath) {
    const absolutePath = path.join(
      __dirname,
      '../schemas/',
      schemaPath
    );
    return this._loadSchema(absolutePath)
      .catch((err) => {
        throw err;
      });
  }

  async _loadRelatedSchema(uri) {
    const regex = /file:\/\//gi;
    uri = uri.replace(regex, '');
    uri = new URL('file:///'+ path.join(__dirname, '../', uri));
    return new Promise((resolve, reject) => {
      const schema = fs.readFileSync(uri);
      if (schema instanceof Error) {
        reject(schema);
      }
      resolve(JSON.parse(schema.toString()));
    });
  }

  async _loadSchema(schema) {
    return await this._readFile(schema)
      .catch((err) => {
        throw err;
      });
  }

  async _readFile(schema) {
    return new Promise((resolve, reject) => {
      const data = fs.readFileSync(schema);
      if (data instanceof Error) {
        reject(data);
      }
      resolve(JSON.parse(data.toString()));
    });
  }
}

module.exports = SchemaValidator;
