let account

const initializeMina = async () => {
  const onboardButton = document.getElementById('connectButton')
  const getAccountsButton = document.getElementById('getAccounts')
  const getAccountsResults = document.getElementById('getAccountsResult')

  onboardButton.onclick = async () => {
    if (!window.mina) {
      alert("No provider was found 请先安装 auro-wallet")
    } else {
      onboardButton.innerText = 'Onboarding in progress'
      let data = await window.mina.requestAccounts().catch(err=>err)
      if(data.result){
        let approveAccount = data.result
        // if (Array.isArray(approveAccount) && approveAccount.length > 0) {
          account = approveAccount
          document.getElementById('accounts').innerHTML = approveAccount;
          onboardButton.innerText = 'Connected'
          onboardButton.disabled = true
        // } 
      }else{
        onboardButton.innerText = data.error.message
      }
    }
  }
  /**
   * get account
   */
  getAccountsButton.onclick = async () => {
    if (window.mina) {
      let data = await window.mina.requestAccounts().catch(err=>err)
      let approveAccount = data.result
      if(approveAccount){
        getAccountsResults.innerHTML = approveAccount;
      }else{
        getAccountsResults.innerHTML = data.error.message
      }
    }
  }


  const sendButton = document.getElementById('sendButton')
  const sendAmountInput = document.getElementById('sendAmountInput')
  const receiveAddressInput = document.getElementById('receiveAddressInput')
  const sendResultDisplay = document.getElementById('sendResultDisplay')

  /**
   * transfer 
   */
  sendButton.onclick = async () => {
    let from = account && account.length > 0 ? account[0] : ""
    let sendResult = await window.mina.signTransfer({
      amount: sendAmountInput.value,
      from: from,
      to: receiveAddressInput.value,
    }).catch(err=>err)
    if(sendResult.result){
      sendResultDisplay.innerHTML = sendResult.result.hash
    }else{
      sendResultDisplay.innerHTML = sendResult.error.message
    }
  }


  /**
   * staking
   */
  const stakingButton = document.getElementById('stakingButton')
  const vaildatorAddressInput = document.getElementById('vaildatorAddressInput')
  const stakingResultDisplay = document.getElementById('stakingResultDisplay')

  stakingButton.onclick = async () => {//质押不用输入金额
    let from = account && account.length > 0 ? account[0] : ""
    let stakingResult = await window.mina.signStaking({
      from: from,
      to: vaildatorAddressInput.value,
    }).catch(err=>err)
    console.log('dapp-staking--0', stakingResult)
    if(stakingResult.result){
      stakingResultDisplay.innerHTML = stakingResult.result.hash
    }else{
      stakingResultDisplay.innerHTML = stakingResult.error.message
    }
  }
  /**
   * sign message
   */
  const signMessageButton = document.getElementById('signMessageButton')
  const signMessageContent = document.getElementById('signMessageContent')
  const signMessageResult = document.getElementById('signMessageResult')
  const signVerifyButton = document.getElementById('signVerifyButton')
  const verifyResult = document.getElementById('verifyResult')


  let signResult

  signMessageButton.onclick = async () => {
    let from = account && account.length > 0 ? account[0] : ""
    signResult = await window.mina.signMessage({
      from: from,
      message: signMessageContent.value,
    }).catch(err=>err)
    if(signResult.result){
      signMessageResult.innerHTML = signResult.result.signature
    }else{
      signMessageResult.innerHTML = signResult.error.message
    }
  }

  /**
   * Verify Message
   */
  signVerifyButton.onclick = async () => {
    let messageVerifyResult = await window.mina.verifyMessage({
      message: signResult.result?.signature,
    }).catch(err=>err)
    if(messageVerifyResult.result){
      verifyResult.innerHTML = messageVerifyResult.result
    }else{
      verifyResult.innerHTML = messageVerifyResult.error.message
    }
  }


  setTimeout(() => {
    if (window.mina) {
      window.mina.onAccountChange(handleNewAccounts);
    }
  }, 200);

  function handleNewAccounts(newAccounts) {
    console.log('handleNewAccounts==0',newAccounts)
    if (Array.isArray(newAccounts)) {
      document.getElementById('accounts').innerHTML = newAccounts;
      if (newAccounts.length === 0) {
        onboardButton.innerText = 'Connect'
        onboardButton.disabled = false
      }
    }
  }
}
window.addEventListener('DOMContentLoaded', initializeMina)