import {ethers} from "hardhat";
import {expect} from "chai";
import {loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers";

interface Item {
    address: string,
    value: number,
}

const MANUAL_TEST: Item[] = [
    {
        address: "0xA5eF618165ED017c8fb1ACA3FC35749626AbdC9E",
        value: 10
    },
    {
        address: "0x5CC3cEBBf5e6386E5827Cc90a2D5C8a06BB6e912",
        value: 50
    },
    {
        address: "0x5215cbeCc900220f7112b3ec1545e015cAd1405A",
        value: 25
    },
    {
        address: "0x2eAEf6DDA7e0E718DE7D863a790bEB49Cc895a01",
        value: 12
    },
    {
        address: "0xe85acDfBFe27aE37Df3D680bBBbAec25be1e5A48",
        value: 8
    },
    {
        address: "0xd542842dfe028500b1c351f84B1c5Dfb89b53893",
        value: 80
    },
]

describe.only("CappedSet Test", function () {
    async function deployManualTestFixture() {

        const CappedSet = await ethers.getContractFactory("CappedSet");
        const cappedSet = await CappedSet.deploy(MANUAL_TEST.length);

        return {cappedSet, MANUAL_TEST};
    }

    describe("Deployment", function () {
        it("Should deploy fail", async function () {
            const CappedSet = await ethers.getContractFactory("CappedSet");
            await expect(CappedSet.deploy(0)).to.be.revertedWithCustomError(CappedSet, "ValueIsZero")
        });
    })

    describe("Insert", function () {
        it("Should insert one", async function () {
            const {cappedSet, MANUAL_TEST} = await loadFixture(deployManualTestFixture);
            await cappedSet.insert(MANUAL_TEST[0].address, MANUAL_TEST[0].value)
            expect(await cappedSet.lowestAddress()).to.equal(MANUAL_TEST[0].address);
            expect(await cappedSet.lowestValue()).to.equal(MANUAL_TEST[0].value);
        });

        it("Should insert all manual test data", async function () {
            const {cappedSet, MANUAL_TEST} = await loadFixture(deployManualTestFixture);
            for (let i = 0; i < MANUAL_TEST.length; i++) {
                await cappedSet.insert(MANUAL_TEST[i].address, MANUAL_TEST[i].value)
            }
            const lowestItem = findLowestItemInArray(MANUAL_TEST)
            expect(await cappedSet.lowestAddress()).to.equal(lowestItem.address);
            expect(await cappedSet.lowestValue()).to.equal(lowestItem.value);
        });

        it("Should fail if exceed max size", async function () {
            const {cappedSet, MANUAL_TEST} = await loadFixture(deployManualTestFixture);
            for (let i = 0; i < MANUAL_TEST.length; i++) {
                await cappedSet.insert(MANUAL_TEST[i].address, MANUAL_TEST[i].value)
            }
            await expect(cappedSet.insert(ethers.Wallet.createRandom().address, MANUAL_TEST[0].value)).to.be
                .revertedWithCustomError(cappedSet, "ExceedMaxNumberElements")
        });

        it("Should fail if insert duplicate address", async function () {
            const {cappedSet, MANUAL_TEST} = await loadFixture(deployManualTestFixture);
            await cappedSet.insert(MANUAL_TEST[0].address, MANUAL_TEST[0].value)
            await cappedSet.insert(MANUAL_TEST[1].address, MANUAL_TEST[1].value)

            await expect(cappedSet.insert(MANUAL_TEST[0].address, 11)).to.be.revertedWithCustomError(cappedSet, "AddressAlreadyExists")
                .withArgs(MANUAL_TEST[0].address)
        });

        it("Should insert with random data", async function () {
            const {cappedSet} = await loadFixture(deployManualTestFixture);
            const size = Number(await cappedSet.numElements());
            const randomTests = generateRandomItemArray(size)
            for (let i = 0; i < randomTests.length; i++) {
                await cappedSet.insert(randomTests[i].address, randomTests[i].value)
            }
            const lowestItem = findLowestItemInArray(randomTests)

            expect(await cappedSet.lowestAddress()).to.equal(lowestItem.address);
            expect(await cappedSet.lowestValue()).to.equal(lowestItem.value);
        });
    })

    describe("Update", function () {
        it("Should update one", async function () {
            const {cappedSet, MANUAL_TEST} = await loadFixture(deployManualTestFixture);
            await cappedSet.insert(MANUAL_TEST[0].address, MANUAL_TEST[0].value)
            await cappedSet.insert(MANUAL_TEST[1].address, MANUAL_TEST[1].value)
            await cappedSet.insert(MANUAL_TEST[2].address, MANUAL_TEST[2].value)

            const updateAddress = MANUAL_TEST[1].address
            const newValue = Math.floor(Math.random() * 1000)

            let randomTests: Item[] = []
            randomTests.push(MANUAL_TEST[0])
            randomTests.push({address: updateAddress, value: newValue})
            randomTests.push(MANUAL_TEST[2])
            const lowestItem = findLowestItemInArray(randomTests)
            await cappedSet.update(updateAddress, newValue)

            expect(await cappedSet.lowestAddress()).to.equal(lowestItem.address);
            expect(await cappedSet.lowestValue()).to.equal(lowestItem.value);
        });

        it("Should fail if update not existing address", async function () {
            const {cappedSet, MANUAL_TEST} = await loadFixture(deployManualTestFixture);
            await cappedSet.insert(MANUAL_TEST[0].address, MANUAL_TEST[0].value)
            await cappedSet.insert(MANUAL_TEST[1].address, MANUAL_TEST[1].value)
            await cappedSet.insert(MANUAL_TEST[2].address, MANUAL_TEST[2].value)
            await expect(cappedSet.update(MANUAL_TEST[3].address, 111)).revertedWithCustomError(cappedSet, "AddressNotExists")
                .withArgs(MANUAL_TEST[3].address)
        });

        it("Should update and get new lowest value", async function () {
            const {cappedSet, MANUAL_TEST} = await loadFixture(deployManualTestFixture);
            for (let i = 0; i < MANUAL_TEST.length; i++) {
                await cappedSet.insert(MANUAL_TEST[i].address, MANUAL_TEST[i].value)
            }
            const lowestItem = findLowestItemInArray(MANUAL_TEST)
            const newLowestItem = lowestItem.value > 1 ? lowestItem.value - 1 : lowestItem.value
            const randomIndex = Math.floor(Math.random() * (MANUAL_TEST.length - 1))
            await cappedSet.update(MANUAL_TEST[randomIndex].address, newLowestItem)

            expect(await cappedSet.lowestAddress()).to.equal(MANUAL_TEST[randomIndex].address);
            expect(await cappedSet.lowestValue()).to.equal(newLowestItem);
        });
    })

    describe("Remove", function () {
        it("Should remove one", async function () {
            const {cappedSet, MANUAL_TEST} = await loadFixture(deployManualTestFixture);
            await cappedSet.insert(MANUAL_TEST[0].address, MANUAL_TEST[0].value)
            await cappedSet.insert(MANUAL_TEST[1].address, MANUAL_TEST[1].value)
            await cappedSet.remove(MANUAL_TEST[1].address)
            expect(await cappedSet.getLength()).to.equal(1);
            expect(await cappedSet.lowestAddress()).to.equal(MANUAL_TEST[0].address);
            expect(await cappedSet.lowestValue()).to.equal(MANUAL_TEST[0].value);
        });

        it("Should remove lowest address", async function () {
            const {cappedSet, MANUAL_TEST} = await loadFixture(deployManualTestFixture);
            for (let i = 0; i < MANUAL_TEST.length; i++) {
                await cappedSet.insert(MANUAL_TEST[i].address, MANUAL_TEST[i].value)
            }
            const lowestItem = findLowestItemInArray(MANUAL_TEST)
            await cappedSet.remove(lowestItem.address)
            const NEW_MANUAL_TEST = MANUAL_TEST.filter(item => item.address != lowestItem.address)
            const newLowestItem = findLowestItemInArray(NEW_MANUAL_TEST)

            expect(await cappedSet.lowestAddress()).to.equal(newLowestItem.address);
            expect(await cappedSet.lowestValue()).to.equal(newLowestItem.value);

            await cappedSet.remove(newLowestItem.address)
            const NEW_MANUAL_TEST_2 = NEW_MANUAL_TEST.filter(item => item.address != newLowestItem.address)
            const newLowestItem2 = findLowestItemInArray(NEW_MANUAL_TEST_2)

            expect(await cappedSet.lowestAddress()).to.equal(newLowestItem2.address);
            expect(await cappedSet.lowestValue()).to.equal(newLowestItem2.value);
        });

        it("Should fail if remove empty capped-set", async function () {
            const {cappedSet, MANUAL_TEST} = await loadFixture(deployManualTestFixture);
            await expect(cappedSet.remove(MANUAL_TEST[0].address)).revertedWithCustomError(cappedSet, "AddressNotExists")
                .withArgs(MANUAL_TEST[0].address)
        });

        it("Should fail if remove not-existing address", async function () {
            const {cappedSet, MANUAL_TEST} = await loadFixture(deployManualTestFixture);
            await cappedSet.insert(MANUAL_TEST[0].address, MANUAL_TEST[0].value)
            await cappedSet.insert(MANUAL_TEST[1].address, MANUAL_TEST[1].value)
            await expect(cappedSet.remove(MANUAL_TEST[3].address)).revertedWithCustomError(cappedSet, "AddressNotExists")
                .withArgs(MANUAL_TEST[3].address)
        });

    })

})


// HELP FUNCTIONS
const findLowestItemInArray = (items: Item[]): Item => {
    if (items.length === 1) {
        return items[0];
    }
    let lowestItem: Item = items[0];
    for (let i = 1; i < items.length; i++) {
        if (items[i].value < lowestItem.value) {
            lowestItem = items[i];
        }
    }
    return lowestItem;
}

const generateRandomItemArray = (size: number): Item[] => {
    let items: Item[] = []
    for (let i = 0; i < size; i++) {
        items.push({
            address: ethers.Wallet.createRandom().address,
            value: Math.floor(Math.random() * 1000)
        })
    }
    return items;
}