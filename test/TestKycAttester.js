const KycAttester = artifacts.require('./KycAttester.sol');

require('chai')
    .use(require('chai-as-promised'))
    .should();

const contractVersion = 1;
contract('TestKycAttester', function (accounts) {
    const admin = accounts[0];
    const newAdmin = accounts[1];
    const guest = accounts[2];
    const attester1 = accounts[3];
    const attesterName1 = "attester1";
    const attester2 = accounts[4];
    const attesterName2 = "attester2";
    const attester3 = accounts[5];
    const attesterName3 = "attester3";
    const attester4 = accounts[6];
    const attesterName4 = "attester4";

    var kycAttester;
    before(async function () {
        kycAttester = await KycAttester.new(contractVersion, { from: admin });
        console.log('kycAttester is deployed: ' + kycAttester.address);

        const contractEvents = kycAttester.allEvents({ _from: 0 }, function (error, result) {
            if (error) assert("error occurs on event emitted");
            console.log("Event emitted: " + result.event + ", attesterId: " + result.args.attesterId + ", blockNumber: " + result.blockNumber);
        });
    })

    describe('check empty attester list', function () {
        it('contains', async function () {
            assert.equal(await kycAttester.contains(attester1, { from: admin }), false);
            assert.equal(await kycAttester.contains(attester2, { from: admin }), false);
        })
        it('size', async function () {
            assert.equal(await kycAttester.size({ from: admin }), 0);
            assert.equal((await kycAttester.getAttesterIds({ from: admin })).length, 0);
        })
    })
    describe('add attester1', function () {
        it('add', async function () {
            await kycAttester.add(attester1, attesterName1, { from: admin }).should.be.fulfilled;
            await kycAttester.add(attester1, attesterName1, { from: admin }).should.be.rejectedWith(/revert/); // update is not allowed
        })
        it('contains', async function () {
            assert.equal(await kycAttester.contains(attester1, { from: admin }), true);
            assert.equal(await kycAttester.contains(attester2, { from: admin }), false);
        })
        it('size', async function () {
            assert.equal(await kycAttester.size({ from: admin }), 1);
            assert.equal((await kycAttester.getAttesterIds({ from: admin })).length, 1);
        })
        it('get', async function () {
            let [attesterId, attesterName, active, updateTime] = await kycAttester.getAttesterInfo(attester1, { from: admin });
            assert.equal(attesterId, attester1);
            assert.equal(attesterName, attesterName1);
            assert.equal(active, true);
        })
        it('list', async function () {
            const attesterIds = await kycAttester.getAttesterIds({ from: admin })
            assert.equal(attesterIds.length, 1);

            // index = 0
            let index = 0;
            let [attesterId, attesterName, active, updateTime] = await kycAttester.getAttesterInfo(attesterIds[index], { from: admin });
            assert.equal(attesterId, attesterIds[index]);
            assert.equal(attesterId, attester1);
            assert.equal(attesterName, attesterName1);
            assert.equal(active, true);
            [attesterId, attesterName, active, updateTime] = await kycAttester.getAttesterInfoByIndex(index, { from: admin });
            assert.equal(attesterId, attesterIds[index]);
            assert.equal(attesterId, attester1);
            assert.equal(attesterName, attesterName1);
            assert.equal(active, true);
        })
        it('activate', async function () {
            let [, , active,] = await kycAttester.getAttesterInfo(attester1, { from: admin });
            assert.equal(active, true);

            // active -> active
            await kycAttester.activate(attester1, true, { from: admin }).should.be.fulfilled;
            [, , active,] = await kycAttester.getAttesterInfo(attester1, { from: admin });
            assert.equal(active, true);

            // active -> inactive
            await kycAttester.activate(attester1, false, { from: admin }).should.be.fulfilled;
            [, , active,] = await kycAttester.getAttesterInfo(attester1, { from: admin });
            assert.equal(active, false);

            // inactive -> inactive
            await kycAttester.activate(attester1, false, { from: admin }).should.be.fulfilled;
            [, , active,] = await kycAttester.getAttesterInfo(attester1, { from: admin });
            assert.equal(active, false);

            // inactive -> active
            await kycAttester.activate(attester1, true, { from: admin }).should.be.fulfilled;
            [, , active,] = await kycAttester.getAttesterInfo(attester1, { from: admin });
            assert.equal(active, true);
        })
    })
    describe('add attester2', function () {
        it('add', async function () {
            await kycAttester.add(attester2, attesterName2, { from: admin }).should.be.fulfilled;
            await kycAttester.add(attester2, attesterName2, { from: admin }).should.be.rejectedWith(/revert/); // update is not allowed
        })
        it('contains', async function () {
            assert.equal(await kycAttester.contains(attester1, { from: admin }), true);
            assert.equal(await kycAttester.contains(attester2, { from: admin }), true);
        })
        it('size', async function () {
            assert.equal(await kycAttester.size({ from: admin }), 2);
            assert.equal((await kycAttester.getAttesterIds({ from: admin })).length, 2);
        })
        it('get', async function () {
            let [attesterId, attesterName, active, updateTime] = await kycAttester.getAttesterInfo(attester2, { from: admin });
            assert.equal(attesterId, attester2);
            assert.equal(attesterName, attesterName2);
            assert.equal(active, true);
        })
        it('list', async function () {
            const attesterIds = await kycAttester.getAttesterIds({ from: admin })
            assert.equal(attesterIds.length, 2);

            // index = 0
            let index = 0;
            let [attesterId, attesterName, active, updateTime] = await kycAttester.getAttesterInfo(attesterIds[index], { from: admin });
            assert.equal(attesterId, attesterIds[index]);
            assert.equal(attesterId, attester1);
            assert.equal(attesterName, attesterName1);
            assert.equal(active, true);
            [attesterId, attesterName, active, updateTime] = await kycAttester.getAttesterInfoByIndex(index, { from: admin });
            assert.equal(attesterId, attesterIds[index]);
            assert.equal(attesterId, attester1);
            assert.equal(attesterName, attesterName1);
            assert.equal(active, true);

            // index = 1
            index = 1;
            [attesterId, attesterName, active, updateTime] = await kycAttester.getAttesterInfo(attesterIds[index], { from: admin });
            assert.equal(attesterId, attesterIds[index]);
            assert.equal(attesterId, attester2);
            assert.equal(attesterName, attesterName2);
            assert.equal(active, true);
            [attesterId, attesterName, active, updateTime] = await kycAttester.getAttesterInfoByIndex(index, { from: admin });
            assert.equal(attesterId, attesterIds[index]);
            assert.equal(attesterId, attester2);
            assert.equal(attesterName, attesterName2);
            assert.equal(active, true);
        })
        it('activate', async function () {
            let [, , active,] = await kycAttester.getAttesterInfo(attester2, { from: admin });
            assert.equal(active, true);

            // active -> active
            await kycAttester.activate(attester2, true, { from: admin }).should.be.fulfilled;
            [, , active,] = await kycAttester.getAttesterInfo(attester2, { from: admin });
            assert.equal(active, true);

            // active -> inactive
            await kycAttester.activate(attester2, false, { from: admin }).should.be.fulfilled;
            [, , active,] = await kycAttester.getAttesterInfo(attester2, { from: admin });
            assert.equal(active, false);

            // inactive -> inactive
            await kycAttester.activate(attester2, false, { from: admin }).should.be.fulfilled;
            [, , active,] = await kycAttester.getAttesterInfo(attester2, { from: admin });
            assert.equal(active, false);

            // inactive -> active
            await kycAttester.activate(attester2, true, { from: admin }).should.be.fulfilled;
            [, , active,] = await kycAttester.getAttesterInfo(attester2, { from: admin });
            assert.equal(active, true);
        })
    })

    describe('check function permissions', function () {
        it('function calls from admin', async function () {
            await kycAttester.owner({ from: admin }).should.be.fulfilled;
            await kycAttester.pendingOwner({ from: admin }).should.be.fulfilled;
            await kycAttester.add(attester3, attesterName3, { from: admin }).should.be.fulfilled;
            await kycAttester.activate(attester3, true, { from: admin }).should.be.fulfilled;
            await kycAttester.size({ from: admin }).should.be.fulfilled;
            await kycAttester.contains(attester1, { from: admin }).should.be.fulfilled;
            await kycAttester.getAttesterInfo(attester1, { from: admin }).should.be.fulfilled;
            await kycAttester.getAttesterInfoByIndex(0, { from: admin }).should.be.fulfilled;
            await kycAttester.getAttesterIds({ from: admin }).should.be.fulfilled;
        })
        it('function calls from guest', async function () {
            await kycAttester.owner({ from: guest }).should.be.fulfilled;
            await kycAttester.pendingOwner({ from: guest }).should.be.fulfilled;
            await kycAttester.add(attester4, attesterName4, { from: guest }).should.be.rejectedWith(/revert/);
            await kycAttester.activate(attester4, true, { from: guest }).should.be.rejectedWith(/revert/);
            await kycAttester.size({ from: guest }).should.be.rejectedWith(/revert/);
            await kycAttester.contains(attester1, { from: guest }).should.be.fulfilled;
            await kycAttester.getAttesterInfo(attester1, { from: guest }).should.be.fulfilled;
            await kycAttester.getAttesterInfoByIndex(0, { from: guest }).should.be.rejectedWith(/revert/);
            await kycAttester.getAttesterIds({ from: guest }).should.be.rejectedWith(/revert/);
        })
    })
    describe('change admin and check function permissions', function () {
        it('transfer ownership to newAdmin', async function () {
            // transferOwnership -> to pendingOwner
            await kycAttester.transferOwnership(newAdmin, { from: admin }).should.be.fulfilled;
            assert.equal(await kycAttester.owner({ from: admin }), admin);
            assert.equal(await kycAttester.pendingOwner({ from: admin }), newAdmin);

            // claimOwnership
            await kycAttester.claimOwnership({ from: newAdmin }).should.be.fulfilled;
            assert.equal(await kycAttester.owner({ from: newAdmin }), newAdmin);
            assert.equal(await kycAttester.pendingOwner({ from: newAdmin }), 0);
        })
        it('function calls from previous admin', async function () {
            await kycAttester.owner({ from: admin }).should.be.fulfilled;
            await kycAttester.pendingOwner({ from: admin }).should.be.fulfilled;
            await kycAttester.add(attester4, attesterName4, { from: admin }).should.be.rejectedWith(/revert/);
            await kycAttester.activate(attester4, true, { from: admin }).should.be.rejectedWith(/revert/);
            await kycAttester.size({ from: admin }).should.be.rejectedWith(/revert/);
            await kycAttester.contains(attester1, { from: admin }).should.be.fulfilled;
            await kycAttester.getAttesterInfo(attester1, { from: admin }).should.be.fulfilled;
            await kycAttester.getAttesterInfoByIndex(0, { from: admin }).should.be.rejectedWith(/revert/);
            await kycAttester.getAttesterIds({ from: admin }).should.be.rejectedWith(/revert/);
        })
        it('function calls from guest', async function () {
            await kycAttester.owner({ from: guest }).should.be.fulfilled;
            await kycAttester.pendingOwner({ from: guest }).should.be.fulfilled;
            await kycAttester.add(attester4, attesterName4, { from: guest }).should.be.rejectedWith(/revert/);
            await kycAttester.activate(attester4, true, { from: guest }).should.be.rejectedWith(/revert/);
            await kycAttester.size({ from: guest }).should.be.rejectedWith(/revert/);
            await kycAttester.contains(attester1, { from: guest }).should.be.fulfilled;
            await kycAttester.getAttesterInfo(attester1, { from: guest }).should.be.fulfilled;
            await kycAttester.getAttesterInfoByIndex(0, { from: guest }).should.be.rejectedWith(/revert/);
            await kycAttester.getAttesterIds({ from: guest }).should.be.rejectedWith(/revert/);
        })
        it('function calls from newAdmin', async function () {
            await kycAttester.owner({ from: newAdmin }).should.be.fulfilled;
            await kycAttester.pendingOwner({ from: newAdmin }).should.be.fulfilled;
            await kycAttester.add(attester4, attesterName4, { from: newAdmin }).should.be.fulfilled;
            await kycAttester.activate(attester4, true, { from: newAdmin }).should.be.fulfilled;
            await kycAttester.size({ from: newAdmin }).should.be.fulfilled;
            await kycAttester.contains(attester1, { from: newAdmin }).should.be.fulfilled;
            await kycAttester.getAttesterInfo(attester1, { from: newAdmin }).should.be.fulfilled;
            await kycAttester.getAttesterInfoByIndex(0, { from: newAdmin }).should.be.fulfilled;
            await kycAttester.getAttesterIds({ from: newAdmin }).should.be.fulfilled;
        })
    })

    after(async function () {
        // kill kycAttester
        await kycAttester.kill({ from: newAdmin }).should.be.fulfilled;
        console.log('kycAttester is killed: ' + kycAttester.address);

        // check if kycAttester is killed
        await kycAttester.owner({ from: newAdmin }).should.be.rejectedWith(Error);
    })
});