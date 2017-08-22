
import { autoinject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { Router } from 'aurelia-router';

import * as UI from './ui-messages';
import { App } from "./app";

@autoinject()
export class HomePage {

    constructor(public router: Router, public eventChannel: EventAggregator) {
        // ...
    }

    activate(parameters, routeConfig) {
        document.getElementById("app").style.display = 'block';
        document.getElementById("loading").style.display = 'none';
    }

}
