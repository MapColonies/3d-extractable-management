const dockerCompose = require('docker-compose');

module.exports = async () => {
  console.log('🧹 Stopping Docker containers...');
  await dockerCompose.down({ commandOptions: ['--remove-orphans'] });
  console.log('🧹 Docker cleanup done');
};
