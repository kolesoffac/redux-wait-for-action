const WAIT_FOR_ACTION = Symbol('WAIT_FOR_ACTION');
const ERROR_ACTION = Symbol('ERROR_ACTION');

export { WAIT_FOR_ACTION, ERROR_ACTION };

export default function() {
  const pendingActionList = [];

  //eslint-disable-next-line
  return store => next => action => {

    for (let i = pendingActionList.length - 1; i >= 0; i--) {
      let pendingActionInfo = pendingActionList[i];
      if (pendingActionInfo.isSuccessAction(action)) {
        pendingActionInfo.resolveCallback(action.payload || action.data || {});
      } else if (pendingActionInfo.isErrorAction(action)) {
        pendingActionInfo.rejectCallback(action.error || action.err || new Error('action.error not specified.'));
      } else {
        continue;
      }
      pendingActionList.splice(pendingActionList.indexOf(pendingActionInfo), 1);
    }

    if (!action[WAIT_FOR_ACTION]) {
      return next(action);
    }

    const successAction = action[WAIT_FOR_ACTION];
    const errorAction = action[ERROR_ACTION];

    const newPendingActionInfo = {};

    if (typeof successAction === 'function') {
      newPendingActionInfo.isSuccessAction = successAction;
    } else {
      newPendingActionInfo.isSuccessAction = action => action.type === successAction;
    }

    if (errorAction) {
      if (typeof errorAction === 'function') {
        newPendingActionInfo.isErrorAction = errorAction;
      } else {
        newPendingActionInfo.isErrorAction = action => action.type === errorAction;
      }
    }

    const promise = new Promise((resolve, reject) => {
      newPendingActionInfo.resolveCallback = resolve;
      newPendingActionInfo.rejectCallback = reject;
    });

    pendingActionList.push(newPendingActionInfo);

    next(action);

    return promise;

  };
}
