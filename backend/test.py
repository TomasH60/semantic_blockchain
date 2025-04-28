import base58
import hashlib

def hex_to_base58check_tron(hex_address):
    if len(hex_address) != 40:
        raise ValueError("Expected 40-character hex address (20 bytes)")

    # Prepend 0x41 (TRON mainnet address prefix)
    prefixed_hex = '41' + hex_address.lower()
    address_bytes = bytes.fromhex(prefixed_hex)

    # Double SHA256 checksum
    hash0 = hashlib.sha256(address_bytes).digest()
    hash1 = hashlib.sha256(hash0).digest()
    checksum = hash1[:4]

    # Concatenate address and checksum
    address_with_checksum = address_bytes + checksum

    # Encode in Base58
    return base58.b58encode(address_with_checksum).decode()

# Example usage
hex_input = "574138562ca8bd1d35068c5b21279610c1f583c4"
tron_address = hex_to_base58check_tron(hex_input)
print(tron_address)
