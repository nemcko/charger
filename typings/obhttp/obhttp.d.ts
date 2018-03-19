declare module ObHttp {
    export interface HttpObservable<T> {
    }

  //  interface ObserverStatic {
		///**
		//* Schedules the invocation of observer methods on the given scheduler.
		//* @param scheduler Scheduler to schedule observer messages on.
		//* @returns Observer whose messages are scheduled on the given scheduler.
		//*/
  //      notifyOn<T>(scheduler: IScheduler): Observer<T>;
  //  }

  //  export interface HttpObservable<T> {
  //      observeOn(scheduler: IScheduler): Observable<T>;
  //      subscribeOn(scheduler: IScheduler): Observable<T>;

  //      amb(rightSource: Observable<T>): Observable<T>;
  //      amb(rightSource: IPromise<T>): Observable<T>;
  //      onErrorResumeNext(second: Observable<T>): Observable<T>;
  //      onErrorResumeNext(second: IPromise<T>): Observable<T>;
  //      bufferWithCount(count: number, skip?: number): Observable<T[]>;
  //      windowWithCount(count: number, skip?: number): Observable<Observable<T>>;
  //      defaultIfEmpty(defaultValue?: T): Observable<T>;
  //      distinct(skipParameter: boolean, valueSerializer: (value: T) => string): Observable<T>;
  //      distinct<TKey>(keySelector?: (value: T) => TKey, keySerializer?: (key: TKey) => string): Observable<T>;
  //      groupBy<TKey, TElement>(keySelector: (value: T) => TKey, skipElementSelector?: boolean, keySerializer?: (key: TKey) => string): Observable<GroupedObservable<TKey, T>>;
  //      groupBy<TKey, TElement>(keySelector: (value: T) => TKey, elementSelector: (value: T) => TElement, keySerializer?: (key: TKey) => string): Observable<GroupedObservable<TKey, TElement>>;
  //      groupByUntil<TKey, TDuration>(keySelector: (value: T) => TKey, skipElementSelector: boolean, durationSelector: (group: GroupedObservable<TKey, T>) => Observable<TDuration>, keySerializer?: (key: TKey) => string): Observable<GroupedObservable<TKey, T>>;
  //      groupByUntil<TKey, TElement, TDuration>(keySelector: (value: T) => TKey, elementSelector: (value: T) => TElement, durationSelector: (group: GroupedObservable<TKey, TElement>) => Observable<TDuration>, keySerializer?: (key: TKey) => string): Observable<GroupedObservable<TKey, TElement>>;
  //  }

  //  interface ObservableStatic {
  //      using<TSource, TResource extends IDisposable>(resourceFactory: () => TResource, observableFactory: (resource: TResource) => Observable<TSource>): Observable<TSource>;
  //      amb<T>(...sources: Observable<T>[]): Observable<T>;
  //      amb<T>(...sources: IPromise<T>[]): Observable<T>;
  //      amb<T>(sources: Observable<T>[]): Observable<T>;
  //      amb<T>(sources: IPromise<T>[]): Observable<T>;
  //      onErrorResumeNext<T>(...sources: Observable<T>[]): Observable<T>;
  //      onErrorResumeNext<T>(...sources: IPromise<T>[]): Observable<T>;
  //      onErrorResumeNext<T>(sources: Observable<T>[]): Observable<T>;
  //      onErrorResumeNext<T>(sources: IPromise<T>[]): Observable<T>;
  //  }
}

declare module "ObHttp" {
    export = ObHttp
}
