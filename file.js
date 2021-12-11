const formidable = require("formidable");
const csv = require("csvtojson");
var getJsonFromCsvFile = async (req) => {
  // Getting File and fields from request using formidable
  try {
    const options = await getFilesAndFieldsFromRequestCsv(req);
    var fields = options.fields;
    var files = options.files;
    if (!isDef(files) || _.isEmpty(files)) {
      throw Boom.notFound("File needs be uploaded");
      // } else if(isDef(fields)) {
      // 	new
    }
  } catch (error) {
    return Boom.boomify(error, {
      message: "Not able to parse file/invalid file",
    });
  }

  if (isDef(files.file)) {
    var old_path = files.file.path;
    var file_name = files.file.name;
    var new_path = path.join(__dirname, "../../public/files", file_name);

    //Moving file to new location
    fs.rename(old_path, new_path, (err) => {
      if (err) {
        return Boom.boomify(err, {
          message: "Not able to rename/move file",
        });
      }
    });

    return await csv().fromFile(new_path);
  } else {
    throw Boom.badRequest("Wrong file key");
  }
};

var getFilesAndFieldsFromRequestCsv = (req, opts) => {
  require("events").EventEmitter.prototype._maxListeners = 100;
  return new Promise(function (resolve, reject) {
    var form = new formidable.IncomingForm(opts);

    //changing temp file location to server

    form.uploadDir = path.join(__dirname, "../../public/tmp/");

    form.on("file", function (name, file) {
      // // The following does not file type work on windows laptop as client.
      // // MS Excel changes 'txt/csv' to 'application/vnd.ms-excel'
      // if (file.type != 'text/csv') {
      // 	return reject(new Error('Please upload a csv file.'));
      // }
    });

    form.parse(req, function (err, fields, files) {
      if (err) return reject(err);
      resolve({
        fields: fields,
        files: files,
      });
    });
  });
};
