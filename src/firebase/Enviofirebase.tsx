import { collection, addDoc, getFirestore, query, where, getDocs, updateDoc, doc } from "@/firebase/";
import { db } from "@/firebase/addToFirebaseCart"; // ajuste o path conforme a localização do firebase.ts

const addToFirebaseCart = async () => {
  setIsAddingToCart(true);

  try {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para adicionar itens ao carrinho",
        variant: "destructive",
      });
      return;
    }

    const userEmail = user.email;

    const carrinhoRef = collection(db, "carrinho");

    // Verifica se o item já está no carrinho
    const q = query(carrinhoRef, where("codigo_material", "==", produto.codigo), where("email", "==", userEmail));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const existingDoc = querySnapshot.docs[0];
      const existingData = existingDoc.data();
      const docRef = doc(db, "carrinho", existingDoc.id);

      await updateDoc(docRef, {
        quantidade: (existingData.quantidade || 0) + 1,
      });

      toast({
        title: "Produto atualizado",
        description: "Quantidade do produto incrementada no carrinho",
      });
    } else {
      await addDoc(carrinhoRef, {
        codigo_material: produto.codigo,
        codigo_estoque: produto.codigoEstoque,
        nome: produto.nome,
        unidade: produto.unidade,
        deposito: produto.deposito,
        quantidade: 1,
        quantidade_minima: produto.quantidadeMinima,
        detalhes: produto.detalhes,
        imagem: produto.imagem,
        unidade_de_medida: produto.unidade,
        valor_unitario: produto.valorUnitario,
        email: userEmail,
      });

      toast({
        title: "Produto adicionado",
        description: "Item adicionado ao carrinho com sucesso",
      });
    }

    if (onAddToCart) {
      onAddToCart(produto);
    }
  } catch (error: any) {
    console.error("Erro ao adicionar ao carrinho:", error);
    toast({
      title: "Erro",
      description: error.message || "Não foi possível adicionar o item ao carrinho",
      variant: "destructive",
    });
  } finally {
    setIsAddingToCart(false);
  }
};
