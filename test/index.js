import { should } from 'micro-should';

import './basic.test.js';
import './net.test.js';

should.runWhen(import.meta.url);
