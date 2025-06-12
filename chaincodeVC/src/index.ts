import "reflect-metadata";
import { type Contract } from "fabric-contract-api";
import VC from "./VC.js";

export const contracts: (typeof Contract)[] = [VC];
