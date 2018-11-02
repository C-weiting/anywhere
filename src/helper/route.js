const fs = require('fs');
const util = require('util');
const path = require('path');
const Handlebars = require('handlebars');
const stat = util.promisify(fs.stat);
const readdir = util.promisify(fs.readdir);
const conf = require('../config/defaultConfig');
const mime = require('../helper/mime');
const compress = require('../helper/compress');

const tplPath = path.join(__dirname, '../templete/dir.tpl');
const source = fs.readFileSync(tplPath);
const templete = Handlebars.compile(source.toString());

module.exports = async function (req, res, filePath) {
    try {
        const stats = await stat(filePath)
        if (stats.isFile()) {
            const mimeType = mime(filePath);
            res.statusCode = 200;
            res.setHeader('Content-Type', mimeType);
            let rs = fs.createReadStream(filePath);
            if (filePath.match(conf.compress)) {
                rs = compress(rs, req, res);
            }
            rs.pipe(res);
        }
        if (stats.isDirectory()) {
            const files = await readdir(filePath);
            const dir = path.relative(conf.root, filePath);
            const data = {
                title: path.basename(filePath),
                dir: dir ? `/${dir}` : '',
                files
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html');
            res.end(templete(data));
        }
    } catch (ex) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end(`${filePath} is not a file or directory`);
    }
}