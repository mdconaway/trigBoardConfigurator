//------------------------------------
//Experimental JSON features
let statusJSON = '';
let configJSON = '';

function nthOcurrence(str, needle, nth) {
  for (let i=0; i < str.length; i++) {
    if (str.charAt(i) == needle) {
        if (!--nth) {
           return i;    
        }
    }
  }
  return -1;
}

function getJSONPayload(str) {
  let splits = `${str}`.split(',');

  if(splits.length <= 2) {
    return {
      header: splits[0],
      suffix: splits[1],
      body: undefined
    };
  }

  let result = [splits.shift(), splits.shift()];
  let sliceFrom = nthOcurrence(str, ',', 2);
  if(sliceFrom === -1) {
    throw new Error(`Improperly formatted packet: ${str}`);
  }
  let body = str.slice(sliceFrom+1);
  result.push(body);

  return {
    header: result[0],
    suffix: result[1],
    body: result[2]
  };
}
//------------------------------------

function connectToBle() {
  // Connect to a device by passing the service UUID
  blueTooth.connect("8dcb402c-b6f0-4b0b-9c7e-9903b9d0e9a7", gotCharacteristics);
  console.log('trying to connect');
}

// A function that will be called once got characteristics
function gotCharacteristics(error, characteristics) {
  console.log('looking for characteristics');
  if (error) { 
    console.log('error: ', error);
  }
  console.log('characteristics: ', characteristics);

  console.log(characteristics.length);
  if (characteristics.length != 2) {
    return;
  }

  for (let i=0; i<2; i++) {
    if (characteristics[i].uuid == '8dcb402d-b6f0-4b0b-9c7e-9903b9d0e9a7') {
      blueToothTXCharacteristic = characteristics[i];
    }
    if (characteristics[i].uuid == '8dcb402e-b6f0-4b0b-9c7e-9903b9d0e9a7') {
      blueToothRXCharacteristic = characteristics[i];
    }
  }

  blueTooth.startNotifications(blueToothRXCharacteristic, gotValue, 'string');
  isConnected = blueTooth.isConnected();

  connectButton.hide();
  showAllParam();

  // Add a event handler when the device is disconnected
  blueTooth.onDisconnected(onDisconnected);
}

// A function that will be called once got values
function gotValue(value) {
  const { header, suffix, body } = getJSONPayload(value);

  if(header === 'status') {
    handleStatusChunk(suffix, body);
  } else if(header === 'config') { //batch config
    handleConfigChunk(suffix, body);
  } else if (header === 'mqsske') { //mqtt ssl key 
    handleSSLKeyChunk(suffix, body, mqttSSLKey);
  } else if (header === 'mqssce') { //mqtt ssl cert 
    handleSSLKeyChunk(suffix, body, mqttSSLCert);
  } else if (header === 'mqssca') { //mqtt ssl ca 
    handleSSLKeyChunk(suffix, body, mqttSSLCA);
  } else if (header === 'OTAprog') {//OTA IS IN PROGRESS
    handleOTAMessage(suffix);
  }
}

function handleStatusChunk(suffix, body) {
  if(suffix === 'w') {
    statusJSON = body;
  } else if (suffix === 'a') {
    statusJSON = `${statusJSON}${body}`;
  } else if (suffix === 'f') {
    let statusObject = JSON.parse(statusJSON);
    statusJSON = '';
    newData=true;
    if (OTAisActive) {
      OTAisActive = false;
      //OTAinProgress=" ";
      showAllParam();
    }
    wifiConnected = statusObject.wifiConnected;
    batteryVoltage = statusObject.battery;
    contactOpen = statusObject.contact == 'open';
    buttonPressed = statusObject.wakeButton;
    macAddress = statusObject.mac;
    fwVersion = statusObject.firmware;
    ipAddress = statusObject.ip;
    connectedSSID = statusObject.ssid;
    if(statusObject.rtc) {
      document.getElementById("currentTimeID").innerHTML = statusObject.rtc;
    }

    if (wifiConnected) {
      otaStartButton.show();
      otaHelpTextTitle.hide();
    } else {
      otaStartButton.hide();
      otaHelpTextTitle.show();
    }
    setNTPUpdateOptions();
    //this will ask the device for its config
    if (firstConnected) {
      console.log(statusObject);
      sendData("#param,");
    }
  }
}

function handleConfigChunk(suffix, body) {
  if(suffix === 'w') {
    configJSON = body;
  } else if (suffix === 'a') {
    configJSON = `${configJSON}${body}`;
  } else if (suffix === 'f') {
    let configObject = JSON.parse(configJSON);
    configJSON = '';
    handleConfig(configObject);
  }
}

function handleSSLKeyChunk(mode, message, input) {
  if(mode === 'w') {
    input.value(message);
  } else if(mode === 'a') {
    input.value(input.value() + message);
  } 
}

function handleOTAMessage(msg) {
  OTAinProgress = msg;
  OTAisActive = true;
  hideAllParam();
}

function handleConfig(config) {
  firstConnected = false;
  const {
    ssid,
    pw,
    tout,
    name,
    sel,
    ope,
    clo,
    tim,
    tse,
    tso,
    tsc,
    lob,
    bof,
    poe,
    pouser,
    poapi,
    wak,
    pse,
    psk,
    ife,
    ifk,
    telegramEnable,
    telegramBOT,
    telegramCHAT,
    ude,
    tce,
    udt,
    uds,
    udg,
    udb,
    uddns,
    uddnss,
    udsi,
    udpw,
    udport,
    rtcm,
    mqe,
    mqp,
    mqs,
    mqt,
    mqse,
    mqsu,
    mqsp,
    sipen,
    sip,
    gip,
    suip,
    pdnsip,
    sdnsip,
    udpBla,
    udpTim,
    highSpd,
    clkEnable,
    clkTimeZone,
    clkAppendEnable,
    clkAlarmEnable,
    clkAlarmHour,
    clkAlarmMinute,
    clkUpdateNTPenable,
    clkAlarmMessage,
    clkAppendAlmEnable,
    appendRSSI,
    missionEnable,
    missionTimeafter
  } = config;

  ssidInput.value(ssid);
  pwInput.value(pw);
  wifiTimeoutInput.value(tout/1000);
  trigBoardNameInput.value(name);
  //sel-------------------
  triggerOpensTitle.hide();
  triggerOpensInput.hide();
  triggerOpensButton.hide();
  triggerClosesTitle.hide();
  triggerClosesInput.hide();
  triggerClosesButton.hide();
  if (sel === 'Close') {
    triggerSelector.value('Contact Close');
    triggerClosesTitle.show();
    triggerClosesInput.show();
    triggerClosesButton.show();
  } else if (sel === 'Open') {
    triggerSelector.value('Contact Open');
    triggerOpensTitle.show();
    triggerOpensInput.show();
    triggerOpensButton.show();
  } else if (sel === 'Both') {
    triggerSelector.value('Open and Close');
    triggerOpensTitle.show();
    triggerOpensInput.show();
    triggerOpensButton.show();
    triggerClosesTitle.show();
    triggerClosesInput.show();
    triggerClosesButton.show();
  }
  //----------------------
  triggerOpensInput.value(ope);
  triggerClosesInput.value(clo); 
  timerInput.value(tim);
  //timer select----------
  if (tse === 'Nothing') {
    timerSelector.value('Nothing');
    timerStillOpenTitle.hide();
    timerStillOpenInput.hide();
    timerStillOpenButton.hide();
    timerStillClosedTitle.hide();
    timerStillClosedInput.hide();
    timerStillClosedButton.hide();
  } else if (tse === 'Closed') {
    timerSelector.value('Contact Still Closed');
    timerStillOpenTitle.hide();
    timerStillOpenInput.hide();
    timerStillOpenButton.hide();
    timerStillClosedTitle.show();
    timerStillClosedInput.show();
    timerStillClosedButton.show();
  } else if (tse === 'Open') {
    timerSelector.value('Contact Still Open');
    timerStillOpenTitle.show();
    timerStillOpenInput.show();
    timerStillOpenButton.show();
    timerStillClosedTitle.hide();
    timerStillClosedInput.hide();
    timerStillClosedButton.hide();
  } else if (tse === 'Either') {
    timerSelector.value('Either Contact');
    timerStillOpenTitle.show();
    timerStillOpenInput.show();
    timerStillOpenButton.show();
    timerStillClosedTitle.show();
    timerStillClosedInput.show();
    timerStillClosedButton.show();
  }
  //--------------------
  timerStillOpenInput.value(tso);
  timerStillClosedInput.value(tsc);
  loBatteryInput.value(lob);
  batteryOffsetInput.value(bof);
  //push over enable----
  if (poe === 't') {
    pushOverEnableCheckbox.checked(true);
    pushCredentTitle.show();
    pushuserTitle.show();
    pushuserInput.show();
    pushapiTitle.show();
    pushapiInput.show();
    pushOverSaveButton.show();
  } else {
    pushOverEnableCheckbox.checked(false);
    pushCredentTitle.hide();
    pushuserTitle.hide();
    pushuserInput.hide();
    pushapiTitle.hide();
    pushapiInput.hide();
    pushOverSaveButton.hide();
  }
  //--------------------
  pushuserInput.value(pouser);
  pushapiInput.value(poapi);
  wakeButtonInput.value(wak);
  //push safer enable---
  if (pse === 't') {
    pushSaferEnableCheckbox.checked(true);
    pushSaferTitle.show();
    pushSaferKeyTitle.show();
    pushSaferInput.show();
    pushSaferSaveButton.show();
  } else {
    pushSaferEnableCheckbox.checked(false);
    pushSaferTitle.hide();
    pushSaferKeyTitle.hide();
    pushSaferInput.hide();
    pushSaferSaveButton.hide();
  }
  //--------------------
  pushSaferInput.value(psk);
  //ifttt enable--------
  if (ife === 't') {
    iftttEnableCheckbox.checked(true);
    iftttTitle.show();
    iftttKeyTitle.show();
    iftttInput.show();
    iftttSaveButton.show();
  } else {
    iftttEnableCheckbox.checked(false);
    iftttTitle.hide();
    iftttKeyTitle.hide();
    iftttInput.hide();
    iftttSaveButton.hide();
  }
  //--------------------
  iftttInput.value(ifk);
  //telegram enabled----
  if (telegramEnable === 't') {
    telegramEnableCheckbox.checked(true);
    telegramCredentTitle.show();
    telegramBOTTitle.show();
    telegramBOTInput.show();
    telegramCHATTitle.show();
    telegramCHATInput.show();
    telegramSaveButton.show();
  } else {
    iftttEnableCheckbox.checked(false);
    telegramCredentTitle.hide();
    telegramBOTTitle.hide();
    telegramBOTInput.hide();
    telegramCHATTitle.hide();
    telegramCHATInput.hide();
    telegramSaveButton.hide();
  }
  //-------------------
  telegramBOTInput.value(telegramBOT);
  telegramCHATInput.value(telegramCHAT);
  //udp enable---------
  let udpEnabled = false;
  if (ude === 't') {
    udpEnabled = true;
    udptcpSelector.value('udp');
    tcpReCountTitle.hide();
    udpTitle.show();
    tcpTitle.hide();
    udpSSIDTitle.show();
    udpSSIDInput.show();
    udpPWTitle.show();
    udpPWInput.show();
    udpStaticIPTitle.show();
    udpStaticIPInput.show();
    udpTargetIPTitle.show();
    udpTargetIPInput.show();
    udpPortTitle.show();
    udpPortInput.show();
    udpGatewayTitle.show();
    udpGatewayInput.show();
    udpSubnetTitle.show();
    udpSubnetInput.show();
    udpPrimaryDNSTitle.show();
    udpPrimaryDNSInput.show();
    udpSecondaryDNSTitle.show();
    udpSecondaryDNSInput.show();
    udpSaveButton.show();
    udpBlastCountTitle.show();
    udpBlastCountInput.show();
    udpBlastTimeTitle.show();
    udpBlastTimeInput.show();
  }
  //------------------
  //tcp enable--------
  let tcpEnabled = false;
  if (tce === 't') {
    tcpEnabled=true;
    udptcpSelector.value('tcp');
    udpTitle.hide();
    tcpTitle.show();
    udpSSIDTitle.show();
    udpSSIDInput.show();
    udpPWTitle.show();
    udpPWInput.show();
    udpStaticIPTitle.show();
    udpStaticIPInput.show();
    udpTargetIPTitle.show();
    udpTargetIPInput.show();
    udpPortTitle.hide();
    udpPortInput.hide();
    udpGatewayTitle.show();
    udpGatewayInput.show();
    udpSubnetTitle.show();
    udpSubnetInput.show();
    udpPrimaryDNSTitle.show();
    udpPrimaryDNSInput.show();
    udpSecondaryDNSTitle.show();
    udpSecondaryDNSInput.show();
    udpSaveButton.show();
    tcpReCountTitle.show();
    udpBlastCountTitle.hide();
    udpBlastCountInput.show();
    udpBlastTimeTitle.hide();
    udpBlastTimeInput.hide();
  }
  //------------------
  //common udp/tcp options
  if (!udpEnabled && !tcpEnabled) {
    udptcpSelector.value('Not Enabled');
    tcpTitle.hide();
    udpTitle.hide();
    udpSSIDTitle.hide();
    udpSSIDInput.hide();
    udpPWTitle.hide();
    udpPWInput.hide();
    udpStaticIPTitle.hide();
    udpStaticIPInput.hide();
    udpTargetIPTitle.hide();
    udpTargetIPInput.hide();
    udpPortTitle.hide();
    udpPortInput.hide();
    udpGatewayTitle.hide();
    udpGatewayInput.hide();
    udpSubnetTitle.hide();
    udpSubnetInput.hide();
    udpPrimaryDNSTitle.hide();
    udpPrimaryDNSInput.hide();
    udpSecondaryDNSTitle.hide();
    udpSecondaryDNSInput.hide();
    udpSaveButton.hide();
    udpBlastCountTitle.hide();
    udpBlastCountInput.hide();
    udpBlastTimeTitle.hide();
    udpBlastTimeInput.hide();
    tcpReCountTitle.hide();
  }
  //------------------
  udpTargetIPInput.value(udt);
  udpStaticIPInput.value(uds);
  udpGatewayInput.value(udg);
  udpSubnetInput.value(udb);
  udpPrimaryDNSInput.value(uddns);
  udpSecondaryDNSInput.value(uddnss);
  udpSSIDInput.value(udsi);
  udpPWInput.value(udpw);
  udpPortInput.value(udport);
  timerUnitSelector.value(rtcm === 't' ? 'Minutes' : 'Seconds');
  //mqtt enable--------
  if (mqe === 't') {
    mqttEnableCheckbox.checked(true);
    mqttTitle.show();
    mqttPortTitle.show();
    mqttPortInput.show();
    mqttServerTitle.show();
    mqttServerInput.show();
    mqttTopicTitle.show();
    mqttTopicInput.show();
    mqttSaveButton.show();
    mqttSecEnableTitle.show();
    mqttSecEnableCheckbox.show();
    mqttSecEnableButton.show();
  } else {
    mqttEnableCheckbox.checked(false);
    mqttTitle.hide();
    mqttPortTitle.hide();
    mqttPortInput.hide();
    mqttServerTitle.hide();
    mqttServerInput.hide();
    mqttTopicTitle.hide();
    mqttTopicInput.hide();
    mqttSaveButton.hide();
    mqttSecEnableTitle.hide();
    mqttSecEnableCheckbox.hide();
    mqttSecEnableButton.hide();
    mqttUserTitle.hide();
    mqttUserInput.hide();
    mqttPWTitle.hide();
    mqttPWInput.hide();
    mqttSSLKeyTitle.hide();
    mqttSSLKey.hide();
    mqttSSLKeySaveButton.hide();
    mqttSSLCertTitle.hide();
    mqttSSLCert.hide();
    mqttSSLCertSaveButton.hide();
    mqttSSLCATitle.hide();
    mqttSSLCA.hide();
    mqttSSLCASaveButton.hide();
  }
  //-----------------
  mqttPortInput.value(mqp);
  mqttServerInput.value(mqs);
  mqttTopicInput.value(mqt);
  //mqtt sec enable 
  if (mqse === 't') {
    mqttSecEnableCheckbox.checked(true);
    mqttUserTitle.show();
    mqttUserInput.show();
    mqttPWTitle.show();
    mqttPWInput.show();
    mqttSSLKeyTitle.show();
    mqttSSLKey.show();
    mqttSSLKeySaveButton.show();
    mqttSSLCertTitle.show();
    mqttSSLCert.show();
    mqttSSLCertSaveButton.show();
    mqttSSLCATitle.show();
    mqttSSLCA.show();
    mqttSSLCASaveButton.show();
  } else {
    mqttSecEnableCheckbox.checked(false);
    mqttUserTitle.hide();
    mqttUserInput.hide();
    mqttPWTitle.hide();
    mqttPWInput.hide();
    mqttSSLKeyTitle.hide();
    mqttSSLKey.hide();
    mqttSSLKeySaveButton.hide();
    mqttSSLCertTitle.hide();
    mqttSSLCert.hide();
    mqttSSLCertSaveButton.hide();
    mqttSSLCATitle.hide();
    mqttSSLCA.hide();
    mqttSSLCASaveButton.hide();
  }
  //-----------------
  mqttUserInput.value(mqsu);
  mqttPWInput.value(mqsp);
  //static ip enable-
  if (sipen === 't') {
    staticEnableCheckbox.checked(true);
    staticIPTitle.show();
    staticIPInput.show();
    staticGatewayTitle.show();
    staticSubnetInput.show();
    staticPrimaryDNSTitle.show();
    staticPrimaryDNSInput.show();
    staticSecondaryDNSTitle.show();
    staticSecondaryDNSInput.show();
    staticSaveButton.show();
    staticGatewayInput.show();
    staticSubnetTitle.show();
  } else {
    staticEnableCheckbox.checked(false);
    staticIPTitle.hide();
    staticIPInput.hide();
    staticGatewayTitle.hide();
    staticSubnetInput.hide();
    staticPrimaryDNSTitle.hide();
    staticPrimaryDNSInput.hide();
    staticSecondaryDNSTitle.hide();
    staticSecondaryDNSInput.hide();
    staticSaveButton.hide();
    staticGatewayInput.hide();
    staticSubnetTitle.hide();
  }
  //---------------
  staticIPInput.value(sip);
  staticGatewayInput.value(gip);
  staticSubnetInput.value(suip);
  staticPrimaryDNSInput.value(pdnsip);
  staticSecondaryDNSInput.value(sdnsip);
  udpBlastCountInput.value(udpBla);
  udpBlastTimeInput.value(udpTim);
  highSpeedEnableCheckbox.checked(highSpd === 't');
  //clock enable----
  if (clkEnable === 't') {
    clockTimerEnableCheckbox.checked(true);
    clockCurrentTime.show();
    clockTimeZoneTitle.show();
    clockTimeZone.show();
    clockTimeZoneButton.show();
    clockSetTimeNTPtitle.show();
    clockAppendTitle.show();
    clockAppendCheckbox.show();
    clockAppendButton.show();
    clockAlarmEnableTitle.show();
    clockAlarmEnableCheckbox.show();
    clockAlarmEnableButton.show();
  } else {
    clockTimerEnableCheckbox.checked(false);
    clockCurrentTime.hide();
    clockTimeZoneTitle.hide();
    clockTimeZone.hide();
    clockTimeZoneButton.hide();
    clockSetTimeNTPtitle.hide();
    clockSetTimeButton.hide();
    clockAppendTitle.hide();
    clockAppendCheckbox.hide();
    clockAppendButton.hide();
    clockAlarmEnableTitle.hide();
    clockAlarmEnableCheckbox.hide();
    clockAlarmEnableButton.hide();
    clockAlarmSettingTitle.hide();
    clockAlarmHour.hide();
    clockAlarmMinute.hide();
    clockAlarmButton.hide();
    clockNTPupdateonAlarmTitle.hide();
    clockNTPupdateonAlarmCheckbox.hide();
    clockNTPupdateonAlarmButton.hide();
    clockAlarmMessageTitle.hide();
    clockAlarmMessage.hide();
    clockAlarmMessageButton.hide();
  }
  //------------------
  clockTimeZone.value(clkTimeZone);
  clockAppendCheckbox.checked(clkAppendEnable === 't');
  //clock append enable
  if (clkAlarmEnable === 't') {
    clockAlarmEnableCheckbox.checked(true);
    clockAlarmSettingTitle.show();
    clockAlarmHour.show();
    clockAlarmMinute.show();
    clockAlarmButton.show();
    clockNTPupdateonAlarmTitle.show();
    clockNTPupdateonAlarmCheckbox.show();
    clockNTPupdateonAlarmButton.show();
    clockAlarmMessageTitle.show();
    clockAlarmMessage.show();
    clockAlarmMessageButton.show();
    clockAppendAlarmTitle.show();
    clockAppendAlarmCheckbox.show();
    clockAppendAlarmButton.show();
  } else {
    clockAlarmEnableCheckbox.checked(false);
    clockAlarmSettingTitle.hide();
    clockAlarmHour.hide();
    clockAlarmMinute.hide();
    clockAlarmButton.hide();
    clockNTPupdateonAlarmTitle.hide();
    clockNTPupdateonAlarmCheckbox.hide();
    clockNTPupdateonAlarmButton.hide();
    clockAlarmMessageTitle.hide();
    clockAlarmMessage.hide();
    clockAlarmMessageButton.hide();
    clockAppendAlarmTitle.hide();
    clockAppendAlarmCheckbox.hide();
    clockAppendAlarmButton.hide();
  }
  //-----------------
  clockAlarmHour.value(clkAlarmHour);
  clockAlarmMinute.value(clkAlarmMinute);
  clockNTPupdateonAlarmCheckbox.checked(clkUpdateNTPenable === 't');
  clockAlarmMessage.value(clkAlarmMessage);
  clockAppendAlarmCheckbox.checked(clkAppendAlmEnable === 't');
  appendRSSIenableCheckbox.checked(appendRSSI === 't');
  //mission critical enable
  if (missionEnable === 't') {
    missionCriticalEnableCheckbox.checked(true);
    missionCriticalTimeTitle.show();
    missionCriticalTimeInput.show();
    missionCriticalTimeButton.show();
  } else {
    missionCriticalEnableCheckbox.checked(false);
    missionCriticalTimeTitle.hide();
    missionCriticalTimeInput.hide();
    missionCriticalTimeButton.hide();
  }
  //----------------
  missionCriticalTimeInput.value(missionTimeafter);
  setNTPUpdateOptions();
}

function setNTPUpdateOptions() {
  if (wifiConnected && clockTimerEnableCheckbox.checked()) {
    document.getElementById("clockSetTimeNTPtitleID").innerHTML = "Set Time with NTP server ";
    clockSetTimeButton.show();
  } else {
    document.getElementById("clockSetTimeNTPtitleID").innerHTML = "Note: Connect to WiFi to set Time from NTP Server! ";
    clockSetTimeButton.hide();
  }
}

function onDisconnected() {
  console.log('Device got disconnected.');
  isConnected = false;
  firstConnected = true;
  connectButton.show();
  hideAllParam();
}

function sendData(data) {
  const inputValue = data;
  if (!("TextEncoder" in window)) {
    console.log("Sorry, this browser does not support TextEncoder...");
    return;
  }
  const enc = new TextEncoder(); // always utf-8
  return blueToothTXCharacteristic.writeValue(enc.encode(inputValue));
}
