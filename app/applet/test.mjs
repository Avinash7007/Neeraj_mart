import fs from 'fs';

const DB_FILE = '/tmp/ngs_data/store_db.json';

if (fs.existsSync(DB_FILE)) {
  console.log("Removing file", DB_FILE);
  fs.unlinkSync(DB_FILE);
}
