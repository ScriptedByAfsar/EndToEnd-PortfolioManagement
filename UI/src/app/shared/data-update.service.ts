import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, ReplaySubject } from 'rxjs';

export interface MasterItem {
  id: number;
  name: string;
  oldName?: string;
  isActive: boolean;
}

export interface MasterDataUpdate {
  type: 'asset' | 'goal';
  action: 'add' | 'update' | 'delete';
  item: MasterItem;
}

@Injectable({
  providedIn: 'root'
})
export class DataUpdateService implements OnDestroy {
  private masterDataSubject = new ReplaySubject<MasterDataUpdate>(1);
  masterDataUpdate$ = this.masterDataSubject.asObservable();

  notifyMasterDataUpdate(update: MasterDataUpdate) {
    this.masterDataSubject.next(update);
  }

  ngOnDestroy() {
    this.masterDataSubject.complete();
  }
}
