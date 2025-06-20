import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/button'

export function ConnectWallet() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    return (
      <div>
        <p>Connected as {`${address?.slice(0, 6)}...${address?.slice(-4)}`}</p>
        <Button onClick={() => disconnect()}>Disconnect</Button>
      </div>
    )
  }

  return (
    <div>
      {connectors.map((connector) => (
        <Button key={connector.id} onClick={() => connect({ connector })}>
          {connector.name}
        </Button>
      ))}
    </div>
  )
} 