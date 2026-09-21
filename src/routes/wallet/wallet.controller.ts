import type { Context } from "hono";
import { createWallet, deleteWallet, getWalletById, getWallets, updateWallet } from "./wallet.service.js";



export async function getWalletsController(c: Context) {
    const userId = c.get("userId");

    try {
        const wallets = await getWallets(userId);

        return c.json(wallets);
    } 

    catch (error) {
        console.log(error);
        return c.json(
            {
                success: false,
                message: `Something went wrong`,
            },
            500
        )
    }
}


export async function getWalletController(c: Context) {

    const userId = c.get("userId");

    try {
        const walletId = Number(c.req.param("id"));

        console.log('wallet id' + walletId)

        const wallet = await getWalletById(
            userId,
            walletId
        );

        if (!wallet) {
            return c.json(
                { message: "Wallet not found" },
                404
            );
        }

        return c.json(wallet);
    } 

    catch (error) {
        console.log(error);
        return c.json(
            {
                success: false,
                message: `Something went wrong`,
            },
            500
        )
    }

}

export const createWalletController = async (c: Context) => {

    const { name, type, initial_balance } = await c.req.json();
     const userId = c.get("userId");

    try {

        const wallet = await createWallet(userId, {name, type, initial_balance});

        return c.json(
            {
                success: false,
                message: `Successfully created`,
                data: wallet
            }, 
            200
        )

    } 

    catch (error) {
        console.log(error);
        return c.json(
            {
                success: true,
                message: `Something went wrong`,
            },
            500
        )
    }

}

export const updateWalletController = async (c: Context) => {

    const { name, type, initial_balance } = await c.req.json();
    const userId = c.get("userId");
    const walletId = Number(c.req.param("id"));

    try {

        const wallet = await updateWallet(
            userId,
            walletId,
            {
                name,
                type,
                initial_balance
            }
        );

        return c.json(
            {
                success: false,
                message: `Successfully created`,
                data: wallet
            }, 
            200
        )

    } 

    catch (error) {
        console.log(error);
        return c.json(
            {
                success: false,
                message: `Something went wrong`,
            },
            500
        )
    }

}


export const deleteWalletController = async (
  c: Context
) => {
    const userId = c.get("userId");

    const walletId = Number(c.req.param("id"));

    try {
        const deleted = await deleteWallet(
            userId,
            walletId
        );

        if (!deleted) {
            return c.json(
            { message: "Wallet not found" },
                404
            );
        }

        return c.json({
            success: true,
            message: "Wallet deleted successfully",
        });
    }

    catch(error) {
        console.log(error);
        return c.json(
            {
                success: false,
                message: `Something went wrong`,
            },
            500
        )
    }

}