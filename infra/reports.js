const xlsx = require('node-xlsx');

const generateReport = async (data) => {
  const report = xlsx.build([{
    name: 'org',
    data,
  }])

  return report
};


module.exports = { generateReport };
