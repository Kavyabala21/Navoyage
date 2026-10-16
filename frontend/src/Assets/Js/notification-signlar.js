window.NotificationSignalR = (function () {

  const HUB_URL =
    window.NAVOYAGE_CONFIG?.notificationHubUrl ||
    "http://localhost:5105/hubs/notifications";
  let connection = null;

  function start(token, onReceive, onUnreadCount) {

    if (!token) return;
    if (!window.signalR) {
      console.error("SignalR client script was not loaded.");
      return;
    }

    if (connection) {
      connection.stop();
      connection = null;
    }

    connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .build();

    connection.serverTimeoutInMilliseconds = 120000;
    connection.keepAliveIntervalInMilliseconds = 15000;

    connection.on("ReceiveNotification", function (data) {
      if (onReceive) onReceive(data);
    });

   
    connection.on("UnreadCountUpdated", function (count) {
      console.log("UnreadCountUpdated received from server:", count);

      if (onUnreadCount) {
        onUnreadCount(count);
      }
    });

    connection.onreconnecting(function (err) {
      console.warn("SignalR reconnecting:", err?.message || err);
    });

    connection.onreconnected(function () {
      console.log("SignalR Reconnected");
    });

    connection.start()
      .then(() => console.log("SignalR Connected"))
      .catch(err => console.error("SignalR Error:", err));
  }

  function stop() {
    if (connection) {
      connection.stop();
      connection = null;
    }
  }

  return {
    start,
    stop
  };

})();
