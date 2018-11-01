const KycAttester = artifacts.require('KycAttester.sol');
const Auth = artifacts.require('Auth.sol');

module.exports = function (deployer, network, accounts) {
  const contractVersion = 1;
  return deployer
    .then(() => deployer.deploy(KycAttester, contractVersion))
    .then(() => deployer.deploy(Auth, contractVersion))
    .catch(error => console.error({ error }));
};
