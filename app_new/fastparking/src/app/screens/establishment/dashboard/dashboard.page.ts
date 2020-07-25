import { dataSource } from './data.chart';
import { ErrorPayload } from './../../../models/errors.model';
import { Platform, ModalController, MenuController } from '@ionic/angular';
import { Component, OnInit } from '@angular/core';
import { UtilService } from 'src/app/services/util.service';
import { AuthServiceProvider } from 'src/app/services/auth.service';
import { EstablishmentService } from 'src/app/services/establishment.service';


import { VacancyService } from 'src/app/services/vacancy.service';
import { ModalVacancies } from '../modal-vacancies/modal-vacancies.page';
import { Establishment, User } from 'src/app/models/user.model';
import { SuccessRequest, ErrorRequest } from 'src/app/models/errors.model';
import { forkJoin, Subscription } from 'rxjs';
import { CounterVacancy, UserBusy } from 'src/app/models/vacancy.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  sub: Subscription;
  user: User;
  isLoading = true;
  vacancies: CounterVacancy = {
    vacanciesAvailables: 0,
    vacanciesBusy: 0
  };

  listClientesBusy: UserBusy[] = [];

  dataSource: object;

  constructor(
    private util: UtilService,
    private auth: AuthServiceProvider,
    private establishmentService: EstablishmentService,
    private platform: Platform,
    private modal: ModalController,
    private vancancyService: VacancyService
  ) {
  }

  ngOnInit() {
    this.sub = forkJoin([
      this.auth.getMeProfile(),
      this.vancancyService.getCounterVacancys(),
      this.vancancyService.getListVacanciesBusy()
    ]).subscribe((response: any) => {

      this.user = response[0].data;
      this.vacancies = response[1];
      this.listClientesBusy = response[2].data;

      this.auth.setUserLogged.next(this.user);

      this.isLoading = false;

    });

    this.dataSource = dataSource;

  }

  doRefresh(event) {

    this.isLoading = true;

    this.ngOnInit();

    setTimeout(() => {
      event.target.complete();
    });

  }

  async openDialog() {

    if (this.vacancies.vacanciesBusy === 0) {
      return false;
    }

    const modal = await this.modal.create({
      component: ModalVacancies,
      cssClass: 'modal-background',
      swipeToClose: true,
      backdropDismiss: true,
      animated: true,
      showBackdrop: true,
      componentProps: {
        list: this.listClientesBusy
      }
    });

    await modal.present();

    modal.onDidDismiss().then(response => {

      this.ngOnInit();

    });

  }

  changeStatus(status: boolean) {

    this.vancancyService.updateActivityEstablishment(status)
    .subscribe((response: SuccessRequest) => {
      
      this.util.showToast(response.message);

    }, (error: ErrorRequest) => {

      this.util.showToast(error.error.message);

    });

  }


  openMenu() {
    this.util.submitEventMenu.next(true);
  }

  ionViewDidLeave() {
    this.sub.unsubscribe();
  }

}
