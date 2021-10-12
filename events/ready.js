const mysql = require('mysql');
const config = require('../config.json')

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        client.user.setActivity('with fire');

        const sqlCon = mysql.createConnection(config.mysqlConf);
        sqlCon.connect((err) => {
            if (err) throw err;
            console.log('Successful test connection to MySQL!');
        });
        sqlCon.end(function(err){
            if (err) throw err;
            console.log('Test connection closed to MySQL!');
        });
    },
};