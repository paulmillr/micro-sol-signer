import { should } from '@paulmillr/jsbt/test.js';

import './basic.test.ts';
import './idl.test.ts';
import './net.test.ts';
import './offchain.test.ts';
import './tokenmetatada.test.ts';
import './versioned.test.ts';

should.runWhen(import.meta.url);
