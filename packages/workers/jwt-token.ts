import { create } from "https://deno.land/x/djwt/mod.ts";

const key = await crypto.subtle.generateKey(
  { name: "HMAC", hash: "SHA-512" },
  true,
  ["sign", "verify"],
);
const jwt = await create({ alg: "HS512", typ: "JWT" }, { foo: "bar" }, key);
console.log(jwt)