import "reflect-metadata";
import { type Contract } from "fabric-contract-api";
import DID from "./DID.js";

export const contracts: (typeof Contract)[] = [DID];
