import { Contract } from "fabric-contract-api";
import { DID } from "./src/DID";

export const contracts: (typeof Contract)[] = [DID];
