// The assumption is that an institution can have more than one DID
// So we keep track of all the VCs issued for a specific DID
const publicRegistry = new Map(); // Map<did, VC[]>

/**
 * This function adds a VC to the list of VCs owned 
 * by a specific DID. If the DID is not in the map,
 * we add it.
 * @param {object} vc 
 */
function addVC(vc) {
  const subject = vc.unsignedVC.credentialSubject.id;
  if (!publicRegistry.has(subject)) publicRegistry.set(subject, []);
  publicRegistry.get(subject).push(vc);
}

/**
 * This function returns the list of VCs associated with a specific DID
 * if the DID is not part of the map, the function returns an empty list
 * @param {string} did 
 * @returns List[object] || []
 */
function getVCs(did) {
  return publicRegistry.get(did) || [];
}

module.exports = {
  addVC,
  getVCs
};