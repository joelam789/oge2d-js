
import { autoinject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { Router, RouterConfiguration } from 'aurelia-router';

import { DialogService } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';

import * as UI from './ui-messages';

@autoinject()
export class App {

	router: Router;

	static page: string = "app";
	static lang: string = "en";

	constructor(public i18n: I18N, public eventChannel: EventAggregator, public dialogService: DialogService) {
	}

	attached(argument) {
		// Invoked once the component is attached to the DOM...
	}

	detached(argument) {
		// Invoked when component is detached from the dom
	}

	configureRouter(config: RouterConfiguration, router: Router) {
		config.title = 'Editor';
		config.map([
			{ route: ['', 'home'],     moduleId: 'home',           name: 'home',    title: 'Home'},
			{ route: 'tileset-editor', moduleId: 'tileset-editor', name: 'tileset', title: 'Tileset'},
			{ route: 'tilemap-editor', moduleId: 'tilemap-editor', name: 'tilemap', title: 'Tilemap'}
		]);
		this.router = router;
	}

	get currentPage(): string {
		if (this.router.currentInstruction) {
			App.page = this.router.currentInstruction.config.name;
		}
		return App.page;
	}

	createNewFile() {
		this.eventChannel.publish(new UI.CreateNewFile(""));
	}

	openFile() {
		this.eventChannel.publish(new UI.OpenFile(""));
	}

	saveFile() {
		this.eventChannel.publish(new UI.SaveFile(""));
	}

	saveFileAs() {
		this.eventChannel.publish(new UI.SaveFileAs(""));
	}

	openPage(page: string) {
		this.router.navigate(page);
	}

	changeLang(lang: string) {
        this.i18n.setLocale(lang)
        .then(() => {
            App.lang = this.i18n.getLocale();
            console.log(App.lang);
        });
	}
	
	
}
