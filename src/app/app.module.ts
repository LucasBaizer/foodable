import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { IonicStorageModule } from '@ionic/storage';
import { Geolocation } from '@ionic-native/geolocation';

import { MainApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { AboutPage } from '../pages/about/about';
import { LearnMore } from '../pages/learn/learn';
import { FilterSearch } from '../pages/filter/filter';

@NgModule({
	declarations: [
		MainApp,
		HomePage,
		LearnMore,
		FilterSearch,
		AboutPage
	],
	imports: [
		BrowserModule,
		IonicModule.forRoot(MainApp),
		IonicStorageModule.forRoot()
	],
	bootstrap: [IonicApp],
	entryComponents: [
		MainApp,
		HomePage,
		LearnMore,
		FilterSearch,
		AboutPage
	],
	providers: [
		StatusBar,
		SplashScreen,
		Geolocation,
		{provide: ErrorHandler, useClass: IonicErrorHandler}
	]
})
export class AppModule {}