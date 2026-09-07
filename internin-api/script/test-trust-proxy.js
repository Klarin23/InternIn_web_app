import assert from "node:assert/strict";
import express from "express";
import { resolveTrustProxySetting } from "../src/config/trustProxy.js";

assert.equal(resolveTrustProxySetting({ NODE_ENV: "development" }), 0);
assert.equal(resolveTrustProxySetting({ NODE_ENV: "production", TRUST_PROXY: "0" }), 0);
assert.equal(resolveTrustProxySetting({ NODE_ENV: "production", TRUST_PROXY: "1" }), 1);
assert.deepEqual(
  resolveTrustProxySetting({
    NODE_ENV: "production",
    TRUST_PROXY: "10.0.0.0/8,192.168.0.0/16",
  }),
  ["10.0.0.0/8", "192.168.0.0/16"],
);
assert.throws(
  () => resolveTrustProxySetting({ NODE_ENV: "production" }),
  /TRUST_PROXY.*explicitement configuré/,
);
assert.throws(
  () => resolveTrustProxySetting({ NODE_ENV: "production", TRUST_PROXY: "11" }),
  /entre 0 et 10/,
);
assert.throws(
  () => resolveTrustProxySetting({ NODE_ENV: "production", TRUST_PROXY: "evil" }),
  /TRUST_PROXY invalide/,
);

const trustedOneHop = express();
trustedOneHop.set("trust proxy", resolveTrustProxySetting({ TRUST_PROXY: "1" }));
trustedOneHop.get("/ip", (req, res) => res.json({ ip: req.ip }));
const oneHopServer = trustedOneHop.listen(0, "127.0.0.1");
await new Promise((resolve) => oneHopServer.once("listening", resolve));
const oneHopPort = oneHopServer.address().port;
const oneHopResponse = await fetch(`http://127.0.0.1:${oneHopPort}/ip`, {
  headers: { "X-Forwarded-For": "198.51.100.10" },
});
assert.equal((await oneHopResponse.json()).ip, "198.51.100.10");
oneHopServer.close();

const noTrust = express();
noTrust.set("trust proxy", resolveTrustProxySetting({ TRUST_PROXY: "0" }));
noTrust.get("/ip", (req, res) => res.json({ ip: req.ip }));
const noTrustServer = noTrust.listen(0, "127.0.0.1");
await new Promise((resolve) => noTrustServer.once("listening", resolve));
const noTrustPort = noTrustServer.address().port;
const noTrustResponse = await fetch(`http://127.0.0.1:${noTrustPort}/ip`, {
  headers: { "X-Forwarded-For": "198.51.100.10" },
});
assert.equal((await noTrustResponse.json()).ip, "127.0.0.1");
noTrustServer.close();

console.log("Trust proxy: OK");
