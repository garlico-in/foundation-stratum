/*
 *
 * Manager (Updated)
 *
 */

// Import Required Modules
let events = require('events');
let crypto = require('crypto');
let bignum = require('bignum');
let util = require('./util.js');

// Import Required Modules
let Algorithms = require('./algorithms.js');

// Max Difficulty
let diff1 = 0x00000000ffff0000000000000000000000000000000000000000000000000000;

// Import BlockTemplate Module
let BlockTemplate = require('./blocks.js');

// Generate Unique ExtraNonce for each Subscriber
let ExtraNonceCounter = function(configInstanceId) {
    let instanceId = configInstanceId || crypto.randomBytes(4).readUInt32LE(0);
    let counter = instanceId << 27;
    this.size = 4;
    this.next = function() {
        let extraNonce = util.packUInt32BE(Math.abs(counter++));
        return extraNonce.toString('hex');
    };
};

// Generate Unique Job for each BlockTemplate
let JobCounter = function() {
    let counter = 0;
    this.next = function() {
        counter++;
        if (counter % 0xffff === 0)
            counter = 1;
        return this.cur();
    };
    this.cur = function() {
        return counter.toString(16);
    };
};

// Check if Input is Hex String
function isHexString(s) {
    let check = String(s).toLowerCase();
    if(check.length % 2) {
        return false;
    }
    for (i = 0; i < check.length; i=i+2) {
        let c = check[i] + check[i+1];
        if (!isHex(c))
            return false;
    }
    return true;
}

// Check if Input is Hex
function isHex(c) {
    let a = parseInt(c,16);
    let b = a.toString(16).toLowerCase();
    if(b.length % 2) {
        b = '0' + b;
    }
    if (b !== c) {
        return false;
    }
    return true;
}

/**
 * Emits:
 * - newBlock(BlockTemplate) - When a new block (previously unknown to the JobManager) is added, use this event to broadcast new jobs
 * - share(shareData, blockHex) - When a worker submits a share. It will have blockHex if a block was found
**/

// Manager Main Function
let Manager = function(options) {

    // Establish Private Manager Variables
    let _this = this;
    let jobCounter = new JobCounter();
    let shareMultiplier = Algorithms[options.coin.algorithm].multiplier;
    let hashDigest = Algorithms[options.coin.algorithm].hash(options.coin);

    // Establish Public Manager Variables
    this.currentJob;
    this.validJobs = {};
    this.extraNonceCounter = new ExtraNonceCounter(options.instanceId);
    this.extraNoncePlaceholder = Buffer.from('f000000ff111111f', 'hex');
    this.extraNonce2Size = this.extraNoncePlaceholder.length - this.extraNonceCounter.size;

    // Determine Block Hash Function
    function blockHash() {
        switch (options.coin.algorithm) {
            default:
                return function (d) {
                    return util.reverseBuffer(util.sha256d(d));
                };
        }
    }

    // Determine Coinbase Hash Function
    function coinbaseHash() {
        switch (options.coin.algorithm) {
            default:
                return util.sha256d;
        }
    }

    // Establish Main Hash Functions
    this.blockHasher = blockHash();
    this.coinbaseHasher = coinbaseHash();

    // Update Current Managed Job
    function updateCurrentJob(rpcData) {
        let tmpBlockTemplate = new BlockTemplate(
            jobCounter.next(),
            rpcData,
            _this.extraNoncePlaceholder,
            options
        );
        _this.currentJob = tmpBlockTemplate;
        _this.emit('updatedBlock', tmpBlockTemplate, true);
        _this.validJobs[tmpBlockTemplate.jobId] = tmpBlockTemplate;
    }

    // Check if New Block is Processed
    this.updateCurrentJob = updateCurrentJob
    this.processTemplate = function(rpcData) {

        // If Current Job !== Previous Job
        let isNewBlock = typeof(_this.currentJob) === 'undefined';
        if ((!isNewBlock && _this.currentJob.rpcData.previousblockhash !== rpcData.previousblockhash) ||
            (!isNewBlock && _this.currentJob.rpcData.bits !== rpcData.bits)) {
            isNewBlock = true;
            if (rpcData.height < _this.currentJob.rpcData.height)
                return false;
        }

        // Check for New Block
        if (!isNewBlock) {
            return false;
        }

        // Update Current Managed Block
        updateCurrentJob(rpcData)
        return true;
    };

    // Process New Submitted Share
    this.processShare = function(jobId, previousDifficulty, difficulty, extraNonce1, extraNonce2, nTime, nonce, ipAddress, port, workerName, soln) {

        // Share is Invalid
        let shareError = function(error) {
            _this.emit('share', {
                job: jobId,
                ip: ipAddress,
                worker: workerName,
                difficulty: difficulty,
                port: port,
                error: error[1]
            });
            return {error: error, result: null};
        };

        // Establish Share Variables
        let submitTime, job, nTimeInt;
        let headerBuffer, headerSolnBuffer, headerHash, headerBigNum;
        let blockHashInvalid, blockHash, blockHex;
        let shareDiff, blockDiffAdjusted;

        // Edge Cases to Check if Share is Invalid
        submitTime = Date.now() / 1000 | 0;
        job = this.validJobs[jobId];
        if (extraNonce2.length / 2 !== _this.extraNonce2Size)
            return shareError([20, 'incorrect size of extranonce2']);
        if (typeof job === 'undefined' || job.jobId != jobId ) {
            return shareError([21, 'job not found']);
        }
        if (nTime.length !== 8) {
            return shareError([20, 'incorrect size of ntime']);
        }
        nTimeInt = parseInt(nTime, 16);
        if (nTimeInt < job.rpcData.curtime || nTimeInt > submitTime + 7200) {
            return shareError([20, 'ntime out of range']);
        }
        if (nonce.length !== 8) {
            return shareError([20, 'incorrect size of nonce']);
        }
        if (!job.registerSubmit([extraNonce1, extraNonce2, nTime, nonce])) {
            return shareError([22, 'duplicate share']);
        }

        // Establish Share Information
        let extraNonce1Buffer = Buffer.from(extraNonce1, 'hex');
        let extraNonce2Buffer = Buffer.from(extraNonce2, 'hex');
        let coinbaseBuffer = job.serializeCoinbase(extraNonce1Buffer, extraNonce2Buffer, options);
        let coinbaseHash = this.coinbaseHasher(coinbaseBuffer);
        let merkleRoot = util.reverseBuffer(job.merkle.withFirst(coinbaseHash)).toString('hex');

        // Start Generating Block Hash
        headerBuffer = job.serializeHeader(merkleRoot, nTime, nonce, options);
        headerHash = hashDigest(headerBuffer, nTimeInt);
        headerBigNum = bignum.fromBuffer(headerHash, {endian: 'little', size: 32});

        // Calculate Share Difficulty
        shareDiff = diff1 / headerBigNum.toNumber() * shareMultiplier;
        blockDiffAdjusted = job.difficulty * shareMultiplier;

        // Check if Share is Valid Block Candidate
        if (job.target.ge(headerBigNum)) {
            blockHex = job.serializeBlock(headerBuffer, coinbaseBuffer, options).toString('hex');
            blockHash = this.blockHasher(headerBuffer, nTime).toString('hex');
        }
        else {
            if (options.emitInvalidBlockHashes) {
                blockHashInvalid = util.reverseBuffer(util.sha256d(headerBuffer)).toString('hex');
            }
            if (shareDiff / difficulty < 0.99) {
                if (previousDifficulty && shareDiff >= previousDifficulty) {
                    difficulty = previousDifficulty;
                }
                else {
                    return shareError([23, 'low difficulty share of ' + shareDiff]);
                }
            }
        }

        // Share is Valid
        _this.emit('share', {
            job: jobId,
            ip: ipAddress,
            port: port,
            worker: workerName,
            height: job.rpcData.height,
            blockReward: job.rpcData.coinbasevalue,
            difficulty: difficulty,
            shareDiff: shareDiff.toFixed(8),
            blockDiff : blockDiffAdjusted,
            blockDiffActual: job.difficulty,
            blockHash: blockHash,
            blockHashInvalid: blockHashInvalid
        }, blockHex);

        // Return Valid Share
        return {result: true, error: null, blockHash: blockHash};
    };
};

// Export Manager
module.exports = Manager;
Manager.prototype.__proto__ = events.EventEmitter.prototype;
