import 'server-only';

// Deliberate server-owned interlock; set false to disable both public AI and
// trusted Google activation. Operator authorized activation on 2026-11-02.
// Region/adult-declaration/quota gates remain mandatory in the public route.
export const aiDiscoveryEnabled = true;
