function packetizeMessage(command, message) {
  let maxPacketSize = 512;
  let open = 'w';
  let append = 'a';
  let close = 'f';
  let commandSize = command.length + 1 + open.length + 1;
  let commandStrings = splitStringBySegmentLength(message, maxPacketSize - commandSize).map((val, i) => {
    return `${command},${(i ? append : open)},${val}`;
  });
  commandStrings.push(`${command},${close},`);
  return tryChunks(commandStrings);
}

// ALL DATA SENT OUT FROM THE GUI TO THE BOARD HERE
function splitStringBySegmentLength(source, segmentLength) {
  if (!segmentLength || segmentLength < 1) {
    throw Error('Segment length must be defined and greater than/equal to 1');
  } 
  const target = [];
  for (
    const array = Array.from(source);
    array.length;
    target.push(array.splice(0,segmentLength).join(''))
  );
  return target;
}

// A method to break data across multiple writes
function tryChunks(dataStrings) {
  if(dataStrings.length) {
    let data = dataStrings.shift();
    console.log(`Sending[${data.length}B]: ${data}`);
    return sendData(data).then(() => {
      return tryChunks(dataStrings);
    });
  }
}

function toTrigboardBoolean(truthy) {
  return truthy ? 't' : 'f'
}

// to sanitize strings **********
function checkUserString(userString, lengthCheck) {
  if (match(userString, "#") != null || match(userString, ",") != null) {
    return 'error no # or comma';
  }
  if (userString.length >= lengthCheck) {
    return 'error too long';
  }
  return null;
}

// validate ip address
function checkUserIPaddress(userIP) {
  let splitNumbers = split(userIP, '.');
  if (splitNumbers.length > 4 || splitNumbers.length < 4) {
    return 'error not valid';
  }
  for (let i = 0; i < 4; i++) {
    if (isNaN(splitNumbers[i])) {
      return 'error not valid';
    }
    if (splitNumbers[i] > 255 || splitNumbers[i] < 0) {
      return 'error not valid';
    }
  }
  return null;
}

// Action functions
function clockSetTimeNTPCommand() {
  document.getElementById("currentTimeID").innerHTML = "PLEASE WAIT... GETTING TIME";
  sendData("#clkNTPset,");
}

function pushOverTestCommand() {
  sendData("#pot,");
}

function killCommand() {
  sendData("#kill,");
}

function otaStartCommand() {
  sendData("#otaStart");
}

function readDocsCommand() {
  window.open('https://trigboard-docs.readthedocs.io/en/latest/configurator.html');
}

function contactCommand() {
  window.open('https://www.kdcircuits.com#contact');
}

function otaGUICommand() {
  window.open('https://github.com/krdarrah/trigUpdater/releases');
}
//******************

function mqttSSLKeySaveCommand() {
  let SSLKey = mqttSSLKey.value().trim();
  packetizeMessage('#mqsslke', SSLKey);
}

function mqttSSLCertSaveCommand() {
  let SSLCert = mqttSSLCert.value().trim();
  packetizeMessage('#mqsslce', SSLCert);
}

function mqttSSLCASaveCommand() {
  let SSLCA = mqttSSLCA.value().trim();
  packetizeMessage('#mqsslca', SSLCA);
}

function saveConfigCommand() {
  let errors = 0;
  let errMessage;
  const missionCriticalTime = parseInt(missionCriticalTimeInput.value(), 10);
  const timeZone = parseInt(clockTimeZone.value(), 10);
  const alarmHour = parseInt(clockAlarmHour.value(), 10);
  const alarmMinute = parseInt(clockAlarmMinute.value(), 10);
  const alarmMessage = clockAlarmMessage.value();
  const ssid = ssidInput.value();
  const pw = pwInput.value();
  const wifiTimeout = parseInt(wifiTimeoutInput.value(), 10);
  const trigboardName = trigBoardNameInput.value();
  const openMessage = triggerOpensInput.value();
  const closeMessage = triggerClosesInput.value();
  const timerValue = parseInt(timerInput.value(), 10);
  const timerStillOpen = timerStillOpenInput.value();
  const timerStillClosed = timerStillClosedInput.value();
  const lowBattery = parseFloat(loBatteryInput.value());
  const pushoverUser = pushuserInput.value();
  const pushoverAPI = pushapiInput.value();
  const wakeButton = wakeButtonInput.value();
  const pushSaferKey = pushSaferInput.value();
  const ifttt = iftttInput.value();
  const telegramBOT = telegramBOTInput.value();
  const telegramCHAT = telegramCHATInput.value();
  const udpTcpDisabled = udptcpSelector.value() === "Not Enabled";
  const batteryOffset = parseFloat(batteryOffsetInput.value());
  const udpSSID = udpSSIDInput.value();
  const udpPW = udpPWInput.value();
  const udpStaticIP = udpStaticIPInput.value();
  const udpTargetIP = udpTargetIPInput.value();
  const udpGateway = udpGatewayInput.value();
  const udpSubnet = udpSubnetInput.value();
  const udpDNS = udpPrimaryDNSInput.value();
  const udpSecondaryDNS = udpSecondaryDNSInput.value();
  const udpPort = parseInt(udpPortInput.value(), 10);
  const udpBlastCount = parseInt(udpBlastCountInput.value(), 10);
  const udpBlastTime = parseInt(udpBlastTimeInput.value(), 10);
  const mqttUser = mqttUserInput.value();
  const mqttPW = mqttPWInput.value();
  const mqttServer = mqttServerInput.value();
  const mqttPort = parseInt(mqttPortInput.value(), 10);
  const mqttTopic = mqttTopicInput.value();
  const staticIP = staticIPInput.value();
  const staticGateway = staticGatewayInput.value();
  const staticSubnet = staticSubnetInput.value();
  const staticPrimaryDNS = staticPrimaryDNSInput.value();
  const staticSecondaryDNS = staticSecondaryDNSInput.value();

  // Mission Critical Timer
  if (checkUserString(missionCriticalTimeInput.value(), 3) != null || isNaN(missionCriticalTime) || missionCriticalTime > 60 || missionCriticalTime <= 0) {
    missionCriticalTimeInput.value("err");
    errors++;
  }
  // Clock Time Zone
  if (checkUserString(clockTimeZone.value(), 5) != null || isNaN(timeZone) || timeZone > 14 || timeZone < -12) {
    clockTimeZone.value("err");
    errors++;
  }
  // Clock Alarm Hour
  if (checkUserString(clockAlarmHour.value(), 5) != null || isNaN(alarmHour) || alarmHour > 23 || alarmHour < 0) {
    clockAlarmHour.value("err");
    errors++;
  }
  // Clock Alarm Minute
  if (checkUserString(clockAlarmMinute.value(), 5) != null || isNaN(alarmMinute) || alarmMinute > 59 || alarmMinute < 0) {
    clockAlarmMinute.value("err");
    errors++;
  }
  // Clock Alarm Message
  errMessage = checkUserString(alarmMessage, 50);
  if (errMessage != null) {
    clockAlarmMessage.value(errMessage);
    errors++;
  }
  // Wifi SSID
  errMessage = checkUserString(ssid, 50);
  if (errMessage != null) {
    ssidInput.value(errMessage);
    errors++;
  }
  // WiFi Password
  errMessage = checkUserString(pw, 50);
  if (errMessage != null) {
    ssidInput.value(errMessage);
    errors++;
  }
  if (pw.length < 8) {
    ssidInput.value('error pw too short');
    errors++;
  }
  // WiFi Timeout
  if (checkUserString(wifiTimeoutInput.value(), 3) != null || isNaN(wifiTimeout) || wifiTimeout > 60 || wifiTimeout <= 0) {
    wifiTimeoutInput.value("err");
    errors++;
  }
  // Trigboard Name
  errMessage = checkUserString(trigboardName, 50)
  if (errMessage != null) {
    trigBoardNameInput.value(errMessage);
    errors++;
  }
  // Open Message
  errMessage = checkUserString(openMessage, 50);
  if (errMessage != null) {
    triggerOpensInput.value(errMessage);
    errors++;
  }
  // Close Message
  errMessage = checkUserString(closeMessage, 50);
  if (errMessage != null) {
    triggerClosesInput.value(errMessage);
    errors++;
  }
  // Timer
  errMessage = checkUserString(timerInput.value(), 4);
  if (errMessage != null || isNaN(timerValue) || timerValue > 255 || timerValue <= 0) {
    timerInput.value("err");
    errors++;
  }
  // Timer Still Open
  errMessage = checkUserString(timerStillOpen, 50);
  if (errMessage != null) {
    timerStillOpenInput.value(errMessage);
    errors++;
  }
  // Timer Still Closed
  errMessage = checkUserString(timerStillClosed, 50);
  if (errMessage != null) {
    timerStillClosedInput.value(errMessage);
    errors++;
  }
  // Low Battery
  errMessage = checkUserString(loBatteryInput.value(), 5);
  if (errMessage != null || isNaN(lowBattery) || lowBattery > 255 || lowBattery <= 0) {
    loBatteryInput.value("err");
    errors++;
  }
  // Pushover User
  errMessage = checkUserString(pushoverUser, 50);
  if (errMessage != null) {
    pushuserInput.value("");
    errors++;
  }
  // Pushover API
  errMessage = checkUserString(pushoverAPI, 50);
  if (errMessage != null) {
    pushapiInput.value("");
    errors++;
  }
  // Wake Button
  errMessage = checkUserString(wakeButton, 50);
  if (errMessage != null) {
    wakeButtonInput.value(errMessage);
    errors++;
  }
  // Push Safer Key
  errMessage = checkUserString(pushSaferKey, 50);
  if (errMessage != null) {
    pushSaferInput.value("");
    errors++;
  }
  // IFTTT
  errMessage = checkUserString(ifttt, 50);
  if (errMessage != null) {
    iftttInput.value("");
    errors++;
  }
  // Telegram Bot
  errMessage = checkUserString(telegramBOT, 50);
  if (errMessage != null) {
    telegramBOTInput.value("");
    errors++;
  }
  // Telegram Chat
  errMessage = checkUserString(telegramCHAT, 50);
  if (errMessage != null) {
    telegramCHATInput.value("");
    errors++;
  }
  // Battery Offset
  if (checkUserString(batteryOffsetInput.value(), 10) != null || isNaN(batteryOffset)) {
    batteryOffsetInput.value("err");
    errors++;
  }
  // UDP SSID
  errMessage = checkUserString(udpSSID, 50);
  if (errMessage != null) {
    udpSSIDInput.value(errMessage);
    errors++;
  }
  // UDP Password
  errMessage = checkUserString(udpPW, 50);
  if (errMessage != null) {
    udpSSIDInput.value(errMessage);
    errors++;
  }
  // UDP Static IP
  errMessage = checkUserIPaddress(udpStaticIP);
  if (errMessage != null) {
    udpStaticIPInput.value(errMessage);
    errors++;
  }
  errMessage = checkUserString(udpStaticIP, 20);
  if (errMessage != null) {
    udpStaticIPInput.value(errMessage);
    errors++;
  }
  // UDP Target IP
  errMessage = checkUserIPaddress(udpTargetIP);
  if (errMessage != null) {
    udpTargetIPInput.value(errMessage);
    errors++;
  }
  errMessage = checkUserString(udpTargetIP, 20);
  if (errMessage != null) {
    udpTargetIPInput.value(errMessage);
    errors++;
  }  
  // UDP Gateway IP
  errMessage = checkUserIPaddress(udpGateway);
  if (errMessage != null) {
    udpGatewayInput.value(errMessage);
    errors++;
  }
  errMessage = checkUserString(udpGateway, 20);
  if (errMessage != null) {
    udpGatewayInput.value(errMessage);
    errors++;
  }
  // UDP Subnet
  errMessage = checkUserIPaddress(udpSubnet);
  if (errMessage != null) {
    udpSubnetInput.value(errMessage);
    errors++;
  }
  errMessage = checkUserString(udpSubnet, 20);
  if (errMessage != null) {
    udpSubnetInput.value(errMessage);
    errors++;
  }
  // UDP DNS
  errMessage = checkUserIPaddress(udpDNS);
  if (errMessage != null) {
    udpPrimaryDNSInput.value(errMessage);
    errors++;
  }
  errMessage = checkUserString(udpDNS, 20);
  if (errMessage != null) {
    udpPrimaryDNSInput.value(errMessage);
    errors++;
  }
  // UDP Secondary DNS
  errMessage = checkUserIPaddress(udpSecondaryDNS);
  if (errMessage != null) {
    udpSecondaryDNSInput.value(errMessage);
    errors++;
  }
  errMessage = checkUserString(udpSecondaryDNS, 20);
  if (errMessage != null) {
    udpSecondaryDNSInput.value(errMessage);
    errors++;
  }
  // UDP Port
  if (checkUserString(udpPortInput.value(), 10) != null || isNaN(udpPort) || udpPort <= 0) {
    udpPortInput.value("err");
    errors++;
  }
  // UDP Blast Count
  if (checkUserString(udpBlastCountInput.value(), 10) != null || isNaN(udpBlastCount) || udpBlastCount > 100 || udpBlastCount <= 0) {
    udpBlastCountInput.value("err");
    errors++;
  }
  // UDP Blast Time
  if (checkUserString(udpBlastTimeInput.value(), 10) != null || isNaN(udpBlastTime) || udpBlastTime > 100 || udpBlastTime <= 0) {
    udpBlastTimeInput.value("err");
    errors++;
  }
  //MQTT User
  errMessage = checkUserString(mqttUser, 50);
  if (errMessage != null) {
    mqttUserInput.value(errMessage);
    errors++;
  }
  // MQTT Password
  errMessage = checkUserString(mqttPW, 50);
  if (errMessage != null) {
    mqttUserInput.value(errMessage);
    errors++;
  }
  // MQTT Server
  errMessage = checkUserString(mqttServer, 50);
  if (errMessage != null) {
    mqttServerInput.value(errMessage);
    errors++;
  }
  // MQTT Port
  if (checkUserString(mqttPortInput.value(), 10) != null || isNaN(mqttPort) || mqttPort <= 0) {
    mqttPortInput.value("err");
    errors++;
  }
  // MQTT Topic
  errMessage = checkUserString(mqttTopic, 50);
  if (errMessage != null) {
    mqttTopicInput.value(errMessage);
    errors++;
  }
  // Static IP
  errMessage = checkUserIPaddress(staticIP);
  if (errMessage != null) {
    staticIPInput.value(errMessage);
    errors++;
  }
  errMessage = checkUserString(staticIP, 20);
  if (errMessage != null) {
    staticIPInput.value(errMessage);
    errors++;
  }
  // Static Gateway
  errMessage = checkUserIPaddress(staticGateway);
  if (errMessage != null) {
    staticGatewayInput.value(errMessage);
    errors++;
  }
  errMessage = checkUserString(staticGateway, 20);
  if (errMessage != null) {
    staticGatewayInput.value(errMessage);
    errors++;
  }
  // Static Subnet
  errMessage = checkUserIPaddress(staticSubnet);
  if (errMessage != null) {
    staticSubnetInput.value(errMessage);
    errors++;
  }
  errMessage = checkUserString(staticSubnet, 20);
  if (errMessage != null) {
    staticSubnetInput.value(errMessage);
    errors++;
  }
  // Static DNS
  errMessage = checkUserIPaddress(staticPrimaryDNS);
  if (errMessage != null) {
    staticPrimaryDNSInput.value(errMessage);
    errors++;
  }
  errMessage = checkUserString(staticPrimaryDNS, 20);
  if (errMessage != null) {
    staticPrimaryDNSInput.value(errMessage);
    errors++;
  }
  // Static Secondary DNS
  errMessage = checkUserIPaddress(staticSecondaryDNS);
  if (errMessage != null) {
    staticSecondaryDNSInput.value(errMessage);
    errors++;
  }
  errMessage = checkUserString(staticSecondaryDNS, 20);
  if (errMessage != null) {
    staticSecondaryDNSInput.value(errMessage);
    errors++;
  }

  if(errors > 0) {
    console.log(`There were ${errors} validation errors`);
    return;
  }

  const config = {
    appendRSSI: toTrigboardBoolean(appendRSSIenableCheckbox.checked()),
    missionEnable: toTrigboardBoolean(missionCriticalEnableCheckbox.checked()),
    missionTimeafter: missionCriticalTime,
    clkEnable: toTrigboardBoolean(clockTimerEnableCheckbox.checked()),
    clkTimeZone: timeZone,
    clkAppendEnable: toTrigboardBoolean(clockAppendCheckbox.checked()),
    clkAppendAlmEnable: toTrigboardBoolean(clockAppendAlarmCheckbox.checked()),
    clkAlarmEnable: toTrigboardBoolean(clockAlarmEnableCheckbox.checked()),
    clkAlarmHour: alarmHour,
    clkAlarmMinute: alarmMinute,
    clkUpdateNTPenable: toTrigboardBoolean(clockNTPupdateonAlarmCheckbox.checked()),
    clkAlarmMessage: alarmMessage,
    ssid,
    pw,
    tout: wifiTimeout,
    name: trigboardName,
    sel: triggerMapper[triggerSelector.value()],
    ope: openMessage,
    clo: closeMessage,
    tim: timerValue,
    tse: timerSelectMapper[timerSelector.value()],
    tso: timerStillOpen,
    tsc: timerStillClosed,
    lob: lowBattery,
    bof: batteryOffset,
    poe: toTrigboardBoolean(pushOverEnableCheckbox.checked()),
    pouser: pushoverUser,
    poapi: pushoverAPI,
    pse: toTrigboardBoolean(pushSaferEnableCheckbox.checked()),
    psk: pushSaferKey,
    wak: wakeButton,
    ife: toTrigboardBoolean(iftttEnableCheckbox.checked()),
    ifk: ifttt,
    telegramEnable: toTrigboardBoolean(telegramEnableCheckbox.checked()),
    telegramBOT,
    telegramCHAT,
    rtcm: timerUnitSelector.value() == 'Minutes',
    mqe: toTrigboardBoolean(mqttEnableCheckbox.checked()),
    mqse: toTrigboardBoolean(mqttSecEnableCheckbox.checked()),
    sipen: toTrigboardBoolean(staticEnableCheckbox.checked()),
    highSpd: toTrigboardBoolean(highSpeedEnableCheckbox.checked()),
    ude: !udpTcpDisabled && udptcpSelector.value() === "udp",
    tce: !udpTcpDisabled && udptcpSelector.value() === "tcp",
    udsi: udpSSID,
    udpw: udpPW,
    uds: udpStaticIP,
    udt: udpTargetIP,
    udg: udpGateway,
    udb: udpSubnet,
    uddns: udpDNS,
    uddnss: udpSecondaryDNS,
    udport: udpPort,
    udpBla: udpBlastCount,
    udpTim: udpBlastTime,
    mqsu: mqttUser,
    mqsp: mqttPW,
    mqs: mqttServer,
    mqp: mqttPort,
    mqt: mqttTopic,
    sip: staticIP,
    gip: staticGateway,
    suip: staticSubnet,
    pdnsip: staticPrimaryDNS,
    sdnsip: staticSecondaryDNS
  };

  // add code to lock UI?
  packetizeMessage('#config', JSON.stringify(config));
}

// DELETE EVERYTHING BELOW THIS COMMENT!!! -------------------------
function appendRSSIenableCommand() {
  if (appendRSSIenableCheckbox.checked()) {
    sendData("#rssien");
  } else {
    sendData("#rssidi");
  }
}

function missionCriticalEnableCommand() {
  if (missionCriticalEnableCheckbox.checked()) {
    sendData("#missionen");
  } else {
    sendData("#missiondi");
  }
}

function missionCriticalTimeCommand() {
  let sanitizer = checkUserString(missionCriticalTimeInput.value(), 3);
  if (sanitizer!=null) {
    missionCriticalTimeInput.value("err");
    return;
  }
  if (isNaN(missionCriticalTimeInput.value())) {
    missionCriticalTimeInput.value("err");
    return;
  }
  if (missionCriticalTimeInput.value() > 60 || missionCriticalTimeInput.value() <=0) {
    missionCriticalTimeInput.value("err");
    return;
  }
  sendData("#tmiss,"+missionCriticalTimeInput.value());
}


function clockTimerEnableCommand() {
  if (clockTimerEnableCheckbox.checked()) {
    sendData("#clken");
  } else {
    sendData("#clkdi");
  }
}

function clockTimeZoneButtonCommand() {
  let sanitizer = checkUserString(clockTimeZone.value(), 5);
  if (sanitizer!=null) {
    clockTimeZone.value("err");
    return;
  }
  if (isNaN(clockTimeZone.value())) {
    clockTimeZone.value("err");
    return;
  }
  if (clockTimeZone.value() > 14 || clockTimeZone.value() <-12) {
    clockTimeZone.value("err");
    return;
  }
  sendData("#clkzn,"+clockTimeZone.value());
}

function clockAppendCommand() {
  if (clockAppendCheckbox.checked()) {
    sendData("#clkappen");
  } else {
    sendData("#clkappdi");
  }
}

function clockAppendAlarmCommand() {
  if (clockAppendAlarmCheckbox.checked()) {
    sendData("#clkalmappen");
  } else {
    sendData("#clkalmappdi");
  }
}

function clockAlarmEnableCommand() {
  if (clockAlarmEnableCheckbox.checked()) {
    sendData("#clkalmen");
  } else {
    sendData("#clkalmdi");
  }
}

function clockAlarmButtonCommand() {
  let sanitizer = checkUserString(clockAlarmHour.value(), 5);
  if (sanitizer!=null) {
    clockAlarmHour.value("err");
    return;
  }
  if (isNaN(clockAlarmHour.value())) {
    clockAlarmHour.value("err");
    return;
  }
  if (clockAlarmHour.value() > 23 || clockAlarmHour.value() <0) {
    clockAlarmHour.value("err");
    return;
  }

  sanitizer = checkUserString(clockAlarmMinute.value(), 5);
  if (sanitizer!=null) {
    clockAlarmMinute.value("err");
    return;
  }
  if (isNaN(clockAlarmMinute.value())) {
    clockAlarmMinute.value("err");
    return;
  }
  if (clockAlarmMinute.value() > 59 || clockAlarmMinute.value() <0) {
    clockAlarmMinute.value("err");
    return;
  }
  sendData("#clkalmtim,"+clockAlarmHour.value() + "," + clockAlarmMinute.value());
}

function clockNTPupdateonAlarmCommand() {
  if (clockNTPupdateonAlarmCheckbox.checked()) {
    sendData("#clkNTPen");
  } else {
    sendData("#clkNTPdi");
  }
}

function clockAlarmMessageButtonCommand() {
  let sanitizer = checkUserString(clockAlarmMessage.value(), 50);
  if (sanitizer!=null) {
    clockAlarmMessage.value(sanitizer);
    return;
  }
  sendData("#clkalarMsg,"+clockAlarmMessage.value());
}

function saveWiFi() {
  let sanitizer = checkUserString(ssidInput.value(), 50);
  if (sanitizer!=null) {
    ssidInput.value(sanitizer);
    return;
  }
  sanitizer = checkUserString(pwInput.value(), 50);
  if (sanitizer!=null) {
    ssidInput.value(sanitizer);
    return;
  }
  if (pwInput.value().length < 8) {
    ssidInput.value('error pw too short');
    return;
  }
  sendData("#wifi,"+ssidInput.value() + "," + pwInput.value());
}

function wifiTimeoutCommand() {
  let sanitizer = checkUserString(wifiTimeoutInput.value(), 3);
  if (sanitizer!=null) {
    wifiTimeoutInput.value("err");
    return;
  }
  if (isNaN(wifiTimeoutInput.value())) {
    wifiTimeoutInput.value("err");
    return;
  }
  if (wifiTimeoutInput.value() > 60 || wifiTimeoutInput.value() <=0) {
    wifiTimeoutInput.value("err");
    return;
  }
  sendData("#tout,"+wifiTimeoutInput.value());
}

function trigBoardNameCommand() {
  let sanitizer = checkUserString(trigBoardNameInput.value(), 50);
  if (sanitizer!=null) {
    trigBoardNameInput.value(sanitizer);
    return;
  }
  sendData("#name,"+trigBoardNameInput.value());
}

function triggerSelectorCommand() {
  sendData("#sel,"+triggerMapper[triggerSelector.value()]);
}

function triggerOpensCommand() {
  let sanitizer = checkUserString(triggerOpensInput.value(), 50);
  if (sanitizer!=null) {
    triggerOpensInput.value(sanitizer);
    return;
  }
  sendData("#ope,"+triggerOpensInput.value());
}

function triggerClosesCommand() {
  let sanitizer = checkUserString(triggerClosesInput.value(), 50);
  if (sanitizer!=null) {
    triggerClosesInput.value(sanitizer);
    return;
  }
  sendData("#clo,"+triggerClosesInput.value());
}

function timerCommand() {
  let sanitizer = checkUserString(timerInput.value(), 4);
  if (sanitizer!=null) {
    timerInput.value("err");
    return;
  }
  if (isNaN(timerInput.value())) {
    timerInput.value("err");
    return;
  }
  if (timerInput.value() > 255 || timerInput.value() <=0) {
    timerInput.value("err");
    return;
  }
  sendData("#tim,"+timerInput.value());
}

function timerSelectorCommand() {
  sendData("#tse,"+trim(timerSelectMapper[timerSelector.value()]));
}

function timerStillOpenCommand() {
  let sanitizer = checkUserString(timerStillOpenInput.value(), 50);
  if (sanitizer!=null) {
    timerStillOpenInput.value(sanitizer);
    return;
  }
  sendData("#tso,"+timerStillOpenInput.value());
}

function timerStillClosedCommand() {
  let sanitizer = checkUserString(timerStillClosedInput.value(), 50);
  if (sanitizer!=null) {
    timerStillClosedInput.value(sanitizer);
    return;
  }
  sendData("#tsc,"+timerStillClosedInput.value());
}

function loBatteryCommand() {
  let sanitizer = checkUserString(loBatteryInput.value(), 5);
  if (sanitizer!=null) {
    loBatteryInput.value("err");
    return;
  }
  if (isNaN(loBatteryInput.value())) {
    loBatteryInput.value("err");
    return;
  }
  if (loBatteryInput.value() > 255 || loBatteryInput.value() <=0) {
    loBatteryInput.value("err");
    return;
  }
  sendData("#lob,"+loBatteryInput.value());
}

function pushOverSaveCommand() {
  let sanitizer = checkUserString(pushuserInput.value(), 50);
  if (sanitizer!=null) {
    pushuserInput.value("");
    return;
  }
  sanitizer = checkUserString(pushapiInput.value(), 50);
  if (sanitizer!=null) {
    pushapiInput.value("");
    return;
  }
  sendData("#pov,"+pushuserInput.value() +","+pushapiInput.value());
}

function wakeButtonCommand() {
  let sanitizer = checkUserString(wakeButtonInput.value(), 50);
  if (sanitizer!=null) {
    wakeButtonInput.value(sanitizer);
    return;
  }
  sendData("#wak,"+wakeButtonInput.value());
}

function pushOverEnableCommand() {
  if (pushOverEnableCheckbox.checked()) {
    sendData("#poe");
  } else {
    sendData("#pod");
  }
}

function pushSaferEnableCommand() {
  if (pushSaferEnableCheckbox.checked()) {
    sendData("#pse");
  } else {
    sendData("#psd");
  }
}

function pushSaferKeySaveCommand() {
  let sanitizer = checkUserString(pushSaferInput.value(), 50);
  if (sanitizer!=null) {
    pushSaferInput.value("");
    return;
  }
  sendData("#psk,"+pushSaferInput.value());
}

function iftttEnableCommand() {
  if (iftttEnableCheckbox.checked()) {
    sendData("#ife");
  } else {
    sendData("#ifd");
  }
}

function iftttKeySaveCommand() {
  let sanitizer = checkUserString(iftttInput.value(), 50);
  if (sanitizer!=null) {
    iftttInput.value("");
    return;
  }
  sendData("#ifk,"+iftttInput.value());
}

function telegramEnableCommand() {
  if (telegramEnableCheckbox.checked()) {
    sendData("#teleEN");
  } else {
    sendData("#teleDI");
  }
}

function telegramSaveCommand() {
  let sanitizer = checkUserString(telegramBOTInput.value(), 50);
  if (sanitizer!=null) {
    telegramBOTInput.value("");
    return;
  }
  sanitizer = checkUserString(telegramCHATInput.value(), 50);
  if (sanitizer!=null) {
    telegramCHATInput.value("");
    return;
  }
  sendData("#telcrd,"+telegramBOTInput.value() +","+telegramCHATInput.value());
}

function timerUnitSelectorCommand() {
  if (timerUnitSelector.value()=='Minutes') {
    sendData("#rtcme");
  } else {
    sendData("#rtcmd");
  }
}

function mqttEnableCommand() {
  if (mqttEnableCheckbox.checked()) {
    sendData("#mqen");
  } else {
    sendData("#mqdi");
  }
}

function mqttSecEnableCommand() {
  if (mqttSecEnableCheckbox.checked()) {
    sendData("#mqsen");
  } else {
    sendData("#mqsdi");
  }
}

function staticEnableCommand() {
  if (staticEnableCheckbox.checked()) {
    sendData("#sipen");
  } else {
    sendData("#sipdi");
  }
}

function highSpeedCommand() {
  if (highSpeedEnableCheckbox.checked()) {
    sendData("#highSpdON");
  } else {
    sendData("#highSpdOFF");
  }
}

function udptcpSelectorCommand() {
  if (udptcpSelector.value() === "Not Enabled") {
    sendData("#udd");
  } else if (udptcpSelector.value() === "udp") {
    sendData("#ude");
  } else if (udptcpSelector.value() === "tcp") {
    sendData("#tce");
  }
}

function batteryOffsetCommand() {
  let sanitizer = checkUserString(batteryOffsetInput.value(), 10);
  if (sanitizer!=null) {
    batteryOffsetInput.value("err");
    return;
  }
  if (isNaN(batteryOffsetInput.value())) {
    loBatteryInput.value("err");
    return;
  }

  sendData("#boff,"+batteryOffsetInput.value());
}

//we also use this for saving tcp settings
function udpSaveCommand() {
  let sanitize = checkUserString(udpSSIDInput.value(), 50);
  if (sanitize!=null) {
    udpSSIDInput.value(sanitize);
    return;
  }
  sanitize = checkUserString(udpPWInput.value(), 50);
  if (sanitize!=null) {
    udpSSIDInput.value(sanitize);
    return;
  }
  sanitize = checkUserIPaddress(udpStaticIPInput.value());
  if (sanitize!=null) {
    udpStaticIPInput.value(sanitize);
    return;
  }
  sanitize = checkUserString(udpStaticIPInput.value(), 20);
  if (sanitize!=null) {
    udpStaticIPInput.value(sanitize);
    return;
  }
  sanitize = checkUserIPaddress(udpTargetIPInput.value());
  if (sanitize!=null) {
    udpTargetIPInput.value(sanitize);
    return;
  }
  sanitize = checkUserString(udpTargetIPInput.value(), 20);
  if (sanitize!=null) {
    udpTargetIPInput.value(sanitize);
    return;
  }  
  sanitize = checkUserIPaddress(udpGatewayInput.value());
  if (sanitize!=null) {
    udpGatewayInput.value(sanitize);
    return;
  }
  sanitize = checkUserString(udpGatewayInput.value(), 20);
  if (sanitize!=null) {
    udpGatewayInput.value(sanitize);
    return;
  }
  sanitize = checkUserIPaddress(udpSubnetInput.value());
  if (sanitize!=null) {
    udpSubnetInput.value(sanitize);
    return;
  }
  sanitize = checkUserString(udpSubnetInput.value(), 20);
  if (sanitize!=null) {
    udpSubnetInput.value(sanitize);
    return;
  }
  sanitize = checkUserIPaddress(udpPrimaryDNSInput.value());
  if (sanitize!=null) {
    udpPrimaryDNSInput.value(sanitize);
    return;
  }
  sanitize = checkUserString(udpPrimaryDNSInput.value(), 20);
  if (sanitize!=null) {
    udpPrimaryDNSInput.value(sanitize);
    return;
  }
  sanitize = checkUserIPaddress(udpSecondaryDNSInput.value());
  if (sanitize!=null) {
    udpSecondaryDNSInput.value(sanitize);
    return;
  }
  sanitize = checkUserString(udpSecondaryDNSInput.value(), 20);
  if (sanitize!=null) {
    udpSecondaryDNSInput.value(sanitize);
    return;
  }
  sanitizer = checkUserString(udpPortInput.value(), 10);
  if (sanitizer!=null) {
    udpPortInput.value("err");
    return;
  }
  if (isNaN(udpPortInput.value())) {
    udpPortInput.value("err");
    return;
  }
  if (udpPortInput.value() <=0) {
    udpPortInput.value("err");
    return;
  }
  sanitizer = checkUserString(udpBlastCountInput.value(), 10);
  if (sanitizer!=null) {
    udpBlastCountInput.value("err");
    return;
  }
  if (isNaN(udpBlastCountInput.value())) {
    udpBlastCountInput.value("err");
    return;
  }
  if (udpBlastCountInput.value() > 100 || udpBlastCountInput.value() <=0) {
    udpBlastCountInput.value("err");
    return;
  }
  sanitizer = checkUserString(udpBlastTimeInput.value(), 10);
  if (sanitizer!=null) {
    udpBlastTimeInput.value("err");
    return;
  }
  if (isNaN(udpBlastTimeInput.value())) {
    udpBlastTimeInput.value("err");
    return;
  }
  if (udpBlastTimeInput.value() > 100 || udpBlastTimeInput.value() <=0) {
    udpBlastTimeInput.value("err");
    return;
  }
  sendData("#udp," + udpSSIDInput.value() + ","+udpPWInput.value() + ","+udpStaticIPInput.value() + ","+udpTargetIPInput.value() +
    ","+udpGatewayInput.value() + ","+udpSubnetInput.value() + ","+udpPrimaryDNSInput.value() + ","+udpSecondaryDNSInput.value()+
    ","+udpPortInput.value()+ ","+udpBlastCountInput.value()+","+udpBlastTimeInput.value());
}

function mqttKeySaveCommand() {
  let sanitize = checkUserString(mqttUserInput.value(), 50);
  if (sanitize!=null) {
    mqttUserInput.value(sanitize);
    return;
  }
  sanitize = checkUserString(mqttPWInput.value(), 50);
  if (sanitize!=null) {
    mqttUserInput.value(sanitize);
    return;
  }
  sanitize = checkUserString(mqttServerInput.value(), 50);
  if (sanitize!=null) {
    mqttServerInput.value(sanitize);
    return;
  }
  sanitizer = checkUserString(mqttPortInput.value(), 10);
  if (sanitizer!=null) {
    mqttPortInput.value("err");
    return;
  }
  if (isNaN(mqttPortInput.value())) {
    mqttPortInput.value("err");
    return;
  }
  if (mqttPortInput.value() <=0) {
    mqttPortInput.value("err");
    return;
  }
  sanitize = checkUserString(mqttTopicInput.value(), 50);
  if (sanitize!=null) {
    mqttTopicInput.value(sanitize);
    return;
  }
  sendData("#mqset,"+mqttPortInput.value()+","+mqttServerInput.value()+","+mqttTopicInput.value()+","+mqttPWInput.value()+","+mqttUserInput.value());
}

function staticSaveCommand() {
  let sanitize = checkUserIPaddress(staticIPInput.value());
  if (sanitize!=null) {
    staticIPInput.value(sanitize);
    return;
  }
  sanitize = checkUserString(staticIPInput.value(), 20);
  if (sanitize!=null) {
    staticIPInput.value(sanitize);
    return;
  }
  sanitize = checkUserIPaddress(staticGatewayInput.value());
  if (sanitize!=null) {
    staticGatewayInput.value(sanitize);
    return;
  }
  sanitize = checkUserString(staticGatewayInput.value(), 20);
  if (sanitize!=null) {
    staticGatewayInput.value(sanitize);
    return;
  }
  sanitize = checkUserIPaddress(staticSubnetInput.value());
  if (sanitize!=null) {
    staticSubnetInput.value(sanitize);
    return;
  }
  sanitize = checkUserString(staticSubnetInput.value(), 20);
  if (sanitize!=null) {
    staticSubnetInput.value(sanitize);
    return;
  } 
  sanitize = checkUserIPaddress(staticPrimaryDNSInput.value());
  if (sanitize!=null) {
    staticPrimaryDNSInput.value(sanitize);
    return;
  }
  sanitize = checkUserString(staticPrimaryDNSInput.value(), 20);
  if (sanitize!=null) {
    staticPrimaryDNSInput.value(sanitize);
    return;
  } 
  sanitize = checkUserIPaddress(staticSecondaryDNSInput.value());
  if (sanitize!=null) {
    staticSecondaryDNSInput.value(sanitize);
    return;
  }
  sanitize = checkUserString(staticSecondaryDNSInput.value(), 20);
  if (sanitize!=null) {
    staticSecondaryDNSInput.value(sanitize);
    return;
  }
  sendData("#sipset,"+staticIPInput.value()+","+staticGatewayInput.value()+","+staticSubnetInput.value()+","+staticPrimaryDNSInput.value()+","+staticSecondaryDNSInput.value());
}
