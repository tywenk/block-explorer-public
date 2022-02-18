//start api integration
import keys from "./api.js"
let [serverUrl, appId] = keys
Moralis.start({ serverUrl, appId })

//DOM selectors
const cardDeck = document.querySelector("#blocks")
const form = document.querySelector("form")
const formLoading = document.querySelector("#form-loading")
form.addEventListener("submit", handleLoadMore)
const initLoading = document.getElementById("init-loader")

//Global vars
let capturedBlock = []

//render a block
function renderBlock(blockInfo, pend) {
  let txs = blockInfo.transactions
  const cardDeck = document.querySelector("#blocks")
  const blockDiv = document.createElement("div")
  blockDiv.className = "card border-secondary text-dark bg-light m-5 p-3"
  blockDiv.innerHTML = `
    <h5 class ='card-header border-0 rounded mb-3' > Block ${blockInfo.number}
      <span class="badge bg-light border rounded-pill text-dark float-end">${
        blockInfo.transaction_count
      } Transactions</span>
    </h5>
    <div id='cardBody${blockInfo.number} class='card-body pb-10'>
      
      <button id='showTxs-${
        blockInfo.number
      }' class='btn btn-primary btn-sm m-b-2 float-end'> Show transactions 
      </button>
      <span class ='card-subtitle badge bg-light border rounded-pill text-dark mb-2'>${moment
        .utc(blockInfo.timestamp)
        .local()
        .format("MMMM Do YYYY, h:mm:ss A")} </span>
      <span class ='card-subtitle badge bg-light border rounded-pill text-dark mb-2' > Gas Used: ${numberWithCommas(
        blockInfo.gas_used
      )} wei</span>
      <div id="txs-${blockInfo.number}" class='container'></div>
    </div>
  `
  if (pend === "append") {
    cardDeck.appendChild(blockDiv)
  } else if (pend === "prepend") {
    cardDeck.insertBefore(blockDiv, cardDeck.firstChild)
  }

  const txDiv = document.getElementById(`txs-${blockInfo.number}`)
  txDiv.classList.add("mt-2")
  txDiv.style.display = "none"
  const txsBtn = document.querySelector(`#showTxs-${blockInfo.number}`)
  txsBtn.addEventListener("click", (e) => handleTxShowHide(txDiv, txsBtn))

  txs ? renderTx(txs, txDiv, blockDiv, blockInfo, txsBtn) : console.log("No transactions")

  let tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  let tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
  })
}

// render a tx in a block
function renderTx(txs, txDiv, blockDiv, blockInfo, txsBtn) {
  let i = 0

  let numcols = 6
  let numrows = Math.floor(txs.length / numcols) + 1

  //create grid of a certain size
  for (let r = 0; r < numrows; r++) {
    const row = document.createElement("div")
    row.className = "row"
    for (let c = 0; c < numcols; c++) {
      if (txs[i]) {
        const col = document.createElement("div")
        col.className = "card col-lg m-1 d-inline-block p-2"
        const txhash = document.createElement("button")
        txhash.className = "btn btn-sm btn-link text-muted font-monospace"

        const emojiDiv = document.createElement("div")
        emojiDiv.className = "w-100 h-100"
        emojiDiv.style = "display: flex; justify-content: space-around;"

        const value = document.createElement("div")
        const gas = document.createElement("div")
        const tofrom = document.createElement("div")

        let valueIntensity = intensity(txs[i].value / 10 ** 18, 0, 10)
        value.innerHTML = `
        <button type="button" class="btn btn-secondary ${valueIntensity}" data-bs-toggle="tooltip" data-bs-placement="bottom" title="${
          txs[i].value / 10 ** 18
        } eth">Ξ</button>
        `
        let gasIntensity = intensity(txs[i].gas, 21000, 510000)
        // gasIntensity = "btn-light"
        gas.innerHTML = `
        <button type="button" class="btn btn-secondary ${gasIntensity}" data-bs-toggle="tooltip" data-bs-placement="bottom" title="${numberWithCommas(
          txs[i].gas
        )} wei">&#9981</button>
        `
        tofrom.innerHTML = `
        <button type="button" class="btn btn-secondary btn-light" data-bs-toggle="tooltip" data-bs-html="true" data-bs-placement="bottom"
        title="<p>From: ${txs[i]["from_address"]}</p><p>To: ${txs[i]["to_address"]}</p>">📍</button>
        `

        txhash.textContent = `${ellipsify(txs[i].hash)}`

        emojiDiv.append(value, gas, tofrom)

        col.append(txhash, emojiDiv)

        row.appendChild(col)

        const hashNum = txs[i].hash
        const blockNum = txs[i].block_number
        const timeStamp = txs[i].block_timestamp
        const toAddress = txs[i].to_address
        const fromAddress = txs[i].from_address
        const gasPrice = txs[i].gas_price
        const valueCurrent = txs[i].value / 10 ** 18

        txhash.addEventListener("click", (e) =>
          handleHashClick(
            e,
            txDiv,
            txsBtn,
            blockDiv,
            blockInfo,
            hashNum,
            blockNum,
            timeStamp,
            toAddress,
            fromAddress,
            gasPrice,
            valueCurrent
          )
        )
      }
      i += 1
    }

    txDiv.appendChild(row)
  }
}

function renderTxDetail(
  txDiv,
  txsBtn,
  blockDiv,
  blockInfo,
  hashNum,
  blockNum,
  timeStamp,
  toAddress,
  fromAddress,
  gasPrice,
  valueCurrent
) {
  let txDetail = document.createElement("div")
  txDetail.classList.add("mt-2")
  txDiv.style.display = "none"
  txsBtn.style.display = "none"
  txDetail.innerHTML = ` 
        <div class="card p-3 ml-1 mr-1 mb-1 rounded">
          <div id='txdata' class='expandTransaction'>
            <button id='resetTxs-${hashNum}' class = 'btn btn-sm btn-primary float-end'> Back </button>
            <div id='hash'>                  
              <p>  
              <span class="badge bg-info">Hash</span> ${hashNum}                  
              <p>
            </div>
            <div id='blockNum'>
              <p>
              <span class="badge bg-info">Block Number</span> ${blockNum}
              </p>
            </div>
            <div id='timestamp'>
              <p>
              <span class="badge bg-primary">Time</span> ${moment
                .utc(timeStamp)
                .local()
                .format("MMMM Do YYYY, h:mm:ss A")}
              </p>
            </div>
            <div id='to'>
              <p>
              <span class="badge bg-secondary">To</span> ${toAddress}
              </p>
            </div>
            <div id='from'>
              <p>
              <span class="badge bg-secondary">From</span> ${fromAddress}
              </p>
            </div>
            <div id='gas-price'>
              <p>
              <span class="badge bg-danger">Gas Price</span> ${numberWithCommas(gasPrice)} wei
              </p>
            </div>
            <div id='value'>
              <p>
              <span class="badge bg-success">Value</span> ${valueCurrent} eth
              </p>
            </div>
          </div>
        </div>  
          `
  blockDiv.appendChild(txDetail)
  const resetBtn = document.querySelector(`#resetTxs-${hashNum}`)
  resetBtn.addEventListener("click", (e) => handleResetBack(e, txDiv, txsBtn, txDetail))
}

//utils
function ellipsify(str) {
  if (str.length > 11) {
    return str.substring(0, 11) + "..."
  } else {
    return str
  }
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

function intensity(val, max, min) {
  let normalize = 1 - Math.max(0, Math.min(1, (val - min) / (max - min)))

  if (normalize < 0.1) {
    return "btn-light"
  } else if (normalize < 0.4) {
    return "btn-success"
  } else if (normalize < 0.8) {
    return "btn-warning"
  } else if (normalize >= 0.95) {
    return "btn-danger"
  } else {
    return "btn-light"
  }
}

//event handlers
async function handleLoadMore(e) {
  e.preventDefault()
  let inputNum = e.target.numNewBlocks.value

  if (inputNum > 10 || inputNum < 1) {
    alert("please enter a value between 1 and 10")
    form.reset()
    return
  }
  formLoading.style.display = "inline-block"

  let newBlocks = await loadBlockBatch(inputNum)
  newBlocks.forEach((blockInfo) => renderBlock(blockInfo, "prepend"))
  formLoading.style.display = "none"
  form.reset()
}

function handleTxShowHide(txDiv, txsBtn) {
  if (txDiv.style.display == "block") {
    txDiv.style.display = "none"
    txsBtn.innerText = "Show Transactions"
  } else if (txDiv.style.display == "none") {
    txDiv.style.display = "block"
    txsBtn.innerText = "Hide Transactions"
  }
}

function handleHashClick(
  e,
  txDiv,
  txsBtn,
  blockDiv,
  blockInfo,
  hashNum,
  blockNum,
  timeStamp,
  toAddress,
  fromAddress,
  gasPrice,
  valueCurrent
) {
  handleTxShowHide(txDiv, txsBtn)
  renderTxDetail(
    txDiv,
    txsBtn,
    blockDiv,
    blockInfo,
    hashNum,
    blockNum,
    timeStamp,
    toAddress,
    fromAddress,
    gasPrice,
    valueCurrent
  )
}

function handleResetBack(e, txDiv, txsBtn, txDetail) {
  txDiv.style.display = "block"
  txsBtn.style.display = "block"
  txsBtn.innerText = "Hide Transactions"
  txDetail.innerHTML = ""
}

//fetchers
async function loadBlockBatch(numBlocks) {
  let blockInfo = []
  let start = capturedBlock[0] - 1

  for (let block = start; block > start - numBlocks; block--) {
    let info = await getBlockInfo(block)
    blockInfo.push(info)
  }

  return blockInfo
}

async function getLatestBlockNumber() {
  let currentTime = moment.utc().format()
  let latestBlockNumber = await Moralis.Web3API.native.getDateToBlock({ date: currentTime })
  latestBlockNumber = latestBlockNumber.block - 3
  capturedBlock.push(latestBlockNumber)
  return latestBlockNumber
}

async function getBlockInfo(blockNumber) {
  let blockInfo = await Moralis.Web3API.native.getBlock({ block_number_or_hash: blockNumber })
  return blockInfo
}

//loop to check for new block every 3 seconds
async function getNextBlock() {
  let prevBlock = capturedBlock[capturedBlock.length - 1]
  let nextBlock = prevBlock + 1
  let nextBlockInfo = await getBlockInfo(nextBlock)

  if (Object.keys(nextBlockInfo).length >= 1) {
    capturedBlock.push(nextBlock)
    renderBlock(nextBlockInfo, "append")
  }
  setTimeout(getNextBlock, 7000)
}

//runs at start
async function init() {
  let latestBlockNumber = await getLatestBlockNumber()
  let latestBlockInfo = await getBlockInfo(latestBlockNumber)

  if (Object.keys(latestBlockInfo).length >= 1) {
    renderBlock(latestBlockInfo, "append")
    initLoading.innerHTML = ""
  } else {
    console.log("No current block")
    setTimeout(init, 7000)
  }
}

async function main() {
  await init()
  await getNextBlock() //loops
}

main()
