import { should } from 'micro-should';

import './basic.test.js';
import './versioned.test.js';
import './idl.test.js';
import './net.test.js';
import './offchain.test.js';
import './tokenmetatada.test.js';

should.runWhen(import.meta.url);
