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
      if(data.message){
        onboardButton.innerText = data.message
      }else{
        let approveAccount = data
        account = approveAccount
        document.getElementById('accounts').innerHTML = approveAccount;
        onboardButton.innerText = 'Connected'
        onboardButton.disabled = true
      }
    }
  }
  /**
   * get account
   */
  getAccountsButton.onclick = async () => {
    if (window.mina) {
      let data = await window.mina.requestAccounts().catch(err=>err)
      let approveAccount = data
      if(data.message){
        getAccountsResults.innerHTML = data.message
      }else{
        getAccountsResults.innerHTML = approveAccount;
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
    let sendResult = await window.mina.sendPayment({
      amount: sendAmountInput.value,
      from: from,
      to: receiveAddressInput.value,
    }).catch(err=>err)
    if(sendResult.hash){
      sendResultDisplay.innerHTML = sendResult.hash
    }else{
      sendResultDisplay.innerHTML = sendResult.message
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
    let stakingResult = await window.mina.sendStakeDelegation({
      from: from,
      to: vaildatorAddressInput.value,
    }).catch(err=>err)
    if(stakingResult.hash){
      stakingResultDisplay.innerHTML = stakingResult.hash
    }else{
      stakingResultDisplay.innerHTML = stakingResult.message
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
    if(signResult.signature){
      signMessageResult.innerHTML = JSON.stringify(signResult.signature)
    }else{
      signMessageResult.innerHTML = signResult.message
    }
  }

  /**
   * Verify Message
   */
  signVerifyButton.onclick = async () => {
    let from = account && account.length > 0 ? account[0] : ""
    let messageVerifyResult = await window.mina.verifyMessage({
      publicKey:from,
      signature:{
        field:signResult?.signature?.field,
        scalar:signResult?.signature?.scalar
      },
      payload:signMessageContent.value
    }).catch(err=>err)
    verifyResult.innerHTML = messageVerifyResult
  }


  setTimeout( async () => {
    if (window.mina) {
      window.mina.on('accountsChanged',handleNewAccounts)
      window.mina.on('chainChanged',handleChainChange)
      
      let data = await window.mina.requestNetwork().catch(err=>err)
      handleChainChange(data)
    }
  }, 200);

  const networkDiv = document.getElementById('network')
  function handleChainChange(newChain) {
    networkDiv.innerHTML = newChain
  }
  

  function handleNewAccounts(newAccounts) {
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