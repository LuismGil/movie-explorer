import 'server-only';

// Deliberate interlock, not a public/env override. Activation requires eligibility/privacy
// verification and abuse/rate-limit review; a configured key alone never enables generation.
export const aiDiscoveryEnabled = false;
