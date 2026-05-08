/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/acctable.json`.
 */
export type Acctable = {
  "address": "9U2SnYkHeWhQHsteHZBGb2W776MrahyWXTuvZhQoQwbi",
  "metadata": {
    "name": "acctable",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [],
      "args": []
    },
    {
      "name": "lock",
      "discriminator": [
        21,
        19,
        208,
        43,
        237,
        62,
        255,
        87
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "lock",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  99,
                  107
                ]
              },
              {
                "kind": "account",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "feeReceiver",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "amt",
          "type": "u64"
        }
      ]
    },
    {
      "name": "markComplete",
      "discriminator": [
        11,
        59,
        70,
        209,
        167,
        193,
        65,
        47
      ],
      "accounts": [
        {
          "name": "payer",
          "signer": true
        },
        {
          "name": "lock",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  99,
                  107
                ]
              },
              {
                "kind": "account",
                "path": "payer"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "unlock",
      "discriminator": [
        101,
        155,
        40,
        21,
        158,
        189,
        56,
        203
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "lock",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  99,
                  107
                ]
              },
              {
                "kind": "account",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "lockState",
      "discriminator": [
        140,
        53,
        195,
        57,
        171,
        177,
        11,
        86
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "tasksNotCompleted",
      "msg": "The tasks to unlock this wallet has not been completed!"
    }
  ],
  "types": [
    {
      "name": "lockState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amt",
            "type": "u64"
          },
          {
            "name": "isCompleted",
            "type": "bool"
          }
        ]
      }
    }
  ]
};
