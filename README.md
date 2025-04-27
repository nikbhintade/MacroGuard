# MacroGuard

Dapp built with FDC to create and buy policy against economic indicators. Data fetched from St. Louis Fed Web Services: FRED® API.

## End to End Flow

We are going to split whole flow into 3 parts as follows:

-   Create and Expiry Policy
-   Buy and Redeem Policy
-   Update Data

Also, in the flow there are 3 entities:

- Policy Buyer (User)
- Policy Creator (Provider)
- Bot

### Create and Expiry Policy

The policy creator deposits coverage tokens to create policies and later expires them to reclaim funds for unpurchased or expired policies.

![](./img/create-expiry-policy.png)

### Buy and Redeem Policy:

The policy buyer pays a premium to buy a policy token and can redeem it for coverage if the policy becomes claimable.

![](./img/buy-redeem-policy.png)


### Update Data:

A bot updates external indicator values, triggering policy status changes based on strike conditions.

![](./img/update-data.png)

## Quick Starter

You can start by cloning repo:

```bash
git clone git@github.com:nikbhintade/MacroGuard.git
```
