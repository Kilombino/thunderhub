/**
 * protobufjs JSON descriptor of lnrpc/offersrpc/offers.proto from the XBT LND
 * fork (tag v0.21.3-beta-blake2b.16). The lightning package bundles no proto
 * for the offersrpc sub-server, so ThunderHub loads this one itself.
 *
 * Regenerate with protobufjs, keeping the snake_case field names:
 * new Root().loadSync('offers.proto', { keepCase: true }).toJSON()
 */
export const offersDescriptor = {
  nested: {
    offersrpc: {
      options: {
        go_package: 'github.com/lightningnetwork/lnd/lnrpc/offersrpc',
      },
      nested: {
        Offers: {
          methods: {
            CreateOffer: {
              requestType: 'CreateOfferRequest',
              responseType: 'CreateOfferResponse',
            },
            ListOffers: {
              requestType: 'ListOffersRequest',
              responseType: 'ListOffersResponse',
            },
            DisableOffer: {
              requestType: 'DisableOfferRequest',
              responseType: 'DisableOfferResponse',
            },
            EnableOffer: {
              requestType: 'EnableOfferRequest',
              responseType: 'EnableOfferResponse',
            },
            DecodeBolt12: {
              requestType: 'DecodeBolt12Request',
              responseType: 'DecodeBolt12Response',
            },
            FetchInvoice: {
              requestType: 'FetchInvoiceRequest',
              responseType: 'FetchInvoiceResponse',
            },
            PayOffer: {
              requestType: 'PayOfferRequest',
              responseType: 'PayOfferResponse',
            },
            ListOfferInvoices: {
              requestType: 'ListOfferInvoicesRequest',
              responseType: 'ListOfferInvoicesResponse',
            },
          },
        },
        CreateOfferRequest: {
          fields: {
            description: { type: 'string', id: 1 },
            amount_msat: { type: 'uint64', id: 2 },
            absolute_expiry: { type: 'uint64', id: 3 },
            issuer: { type: 'string', id: 4 },
            quantity_max: { type: 'uint64', id: 5 },
            label: { type: 'string', id: 6 },
            with_paths: { type: 'bool', id: 7 },
            no_paths: { type: 'bool', id: 8 },
            quantity_any: { type: 'bool', id: 9 },
          },
        },
        Offer: {
          fields: {
            offer_id: { type: 'bytes', id: 1 },
            bolt12: { type: 'string', id: 2 },
            description: { type: 'string', id: 3 },
            amount_msat: { type: 'uint64', id: 4 },
            absolute_expiry: { type: 'uint64', id: 5 },
            created_at: { type: 'uint64', id: 6 },
            active: { type: 'bool', id: 7 },
            invoices_issued: { type: 'uint64', id: 8 },
            label: { type: 'string', id: 9 },
            issuer_id: { type: 'bytes', id: 10 },
            num_paths: { type: 'uint32', id: 11 },
            chains: { rule: 'repeated', type: 'bytes', id: 12 },
            issuer: { type: 'string', id: 13 },
            quantity_max: { type: 'uint64', id: 14 },
            quantity_any: { type: 'bool', id: 15 },
          },
        },
        CreateOfferResponse: {
          fields: {
            offer: { type: 'Offer', id: 1 },
            created: { type: 'bool', id: 2 },
          },
        },
        ListOffersRequest: { fields: { active_only: { type: 'bool', id: 1 } } },
        ListOffersResponse: {
          fields: { offers: { rule: 'repeated', type: 'Offer', id: 1 } },
        },
        DisableOfferRequest: { fields: { offer_id: { type: 'bytes', id: 1 } } },
        DisableOfferResponse: { fields: {} },
        EnableOfferRequest: { fields: { offer_id: { type: 'bytes', id: 1 } } },
        EnableOfferResponse: { fields: {} },
        DecodeBolt12Request: { fields: { bolt12: { type: 'string', id: 1 } } },
        InvoiceRequestInfo: {
          fields: {
            payer_id: { type: 'bytes', id: 1 },
            amount_msat: { type: 'uint64', id: 2 },
            quantity: { type: 'uint64', id: 3 },
            payer_note: { type: 'string', id: 4 },
            metadata: { type: 'bytes', id: 5 },
            signature_valid: { type: 'bool', id: 6 },
          },
        },
        InvoiceInfo: {
          fields: {
            payment_hash: { type: 'bytes', id: 1 },
            amount_msat: { type: 'uint64', id: 2 },
            node_id: { type: 'bytes', id: 3 },
            created_at: { type: 'uint64', id: 4 },
            relative_expiry: { type: 'uint32', id: 5 },
            num_paths: { type: 'uint32', id: 6 },
            payer_id: { type: 'bytes', id: 7 },
            signature_valid: { type: 'bool', id: 8 },
          },
        },
        DecodeBolt12Response: {
          fields: {
            type: { type: 'string', id: 1 },
            for_this_chain: { type: 'bool', id: 2 },
            chains: { rule: 'repeated', type: 'bytes', id: 3 },
            offer_id: { type: 'bytes', id: 4 },
            offer: { type: 'Offer', id: 5 },
            invoice_request: { type: 'InvoiceRequestInfo', id: 6 },
            invoice: { type: 'InvoiceInfo', id: 7 },
            valid: { type: 'bool', id: 8 },
            validation_error: { type: 'string', id: 9 },
            ours: { type: 'bool', id: 10 },
          },
        },
        FetchInvoiceRequest: {
          fields: {
            offer: { type: 'string', id: 1 },
            amount_msat: { type: 'uint64', id: 2 },
            quantity: { type: 'uint64', id: 3 },
            payer_note: { type: 'string', id: 4 },
            timeout_seconds: { type: 'uint32', id: 5 },
          },
        },
        FetchInvoiceResponse: {
          fields: {
            bolt12: { type: 'string', id: 1 },
            invoice: { type: 'InvoiceInfo', id: 2 },
            offer_id: { type: 'bytes', id: 3 },
          },
        },
        PayOfferRequest: {
          fields: {
            offer: { type: 'string', id: 1 },
            invoice: { type: 'string', id: 2 },
            amount_msat: { type: 'uint64', id: 3 },
            quantity: { type: 'uint64', id: 4 },
            payer_note: { type: 'string', id: 5 },
            timeout_seconds: { type: 'uint32', id: 6 },
            fee_limit_msat: { type: 'uint64', id: 7 },
            max_parts: { type: 'uint32', id: 8 },
          },
        },
        PayOfferResponse: {
          fields: {
            bolt12: { type: 'string', id: 1 },
            payment_hash: { type: 'bytes', id: 2 },
            payment_preimage: { type: 'bytes', id: 3 },
            amount_msat: { type: 'uint64', id: 4 },
            fee_msat: { type: 'uint64', id: 5 },
          },
        },
        OfferInvoice: {
          fields: {
            payment_hash: { type: 'bytes', id: 1 },
            offer_id: { type: 'bytes', id: 2 },
            payer_id: { type: 'bytes', id: 3 },
            amount_msat: { type: 'uint64', id: 4 },
            quantity: { type: 'uint64', id: 5 },
            created_at: { type: 'uint64', id: 6 },
            bolt12: { type: 'string', id: 7 },
            state: { type: 'string', id: 8 },
            amount_paid_msat: { type: 'uint64', id: 9 },
          },
        },
        ListOfferInvoicesRequest: {
          fields: { offer_id: { type: 'bytes', id: 1 } },
        },
        ListOfferInvoicesResponse: {
          fields: {
            invoices: { rule: 'repeated', type: 'OfferInvoice', id: 1 },
          },
        },
      },
    },
  },
};
