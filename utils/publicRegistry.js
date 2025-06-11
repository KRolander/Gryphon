const fs = require("fs");

// The assumption is that an institution can have more than one DID
// So we keep track of all the VCs issued for a specific DID
// const publicRegistry = new Map(); // Map<did, VC[]>

/**
 * This function adds a VC to the list of VCs owned 
 * by a specific DID. If the DID is not in the map,
 * we add it.
 * @param {object} vc 
 */
function addVC(publicRegistry, vc) {
  const subject = vc.credentialSubject.id;
  if (!publicRegistry.has(subject)) publicRegistry.set(subject, []);
  publicRegistry.get(subject).push(vc);
}

/**
 * This function returns the list of VCs associated with a specific DID
 * if the DID is not part of the map, the function returns an empty list
 * @param {string} did 
 * @returns List[object] || []
 */
function getVCs(publicRegistry, did) {
  return publicRegistry.get(did) || [];
}

/**
 * This function is supposed to convert a JSON object 
 * (in this case the registry) into a map
 * @param {string} registryPath 
 * @returns the map representation of the registry
 */
function loadRegistryAsMap(registryPath) {
  if (!fs.existsSync(registryPath)) return new Map();

  const raw = fs.readFileSync(registryPath, 'utf-8');
  const obj = JSON.parse(raw);
  return new Map(Object.entries(obj)); // JSON object → Map
}

/**
 * This function is supposed to save the 
 * changes made to the map inside the registry
 * as a JSON
 * @param {object} registryMap 
 * @param {string} registryPath 
 */
function saveRegistryFromMap(registryMap, registryPath) {
  const obj = Object.fromEntries(registryMap); // Map → JSON object
  fs.writeFileSync(registryPath, JSON.stringify(obj, null, 2));
}

module.exports = {
  addVC,
  getVCs,
  loadRegistryAsMap, 
  saveRegistryFromMap
};